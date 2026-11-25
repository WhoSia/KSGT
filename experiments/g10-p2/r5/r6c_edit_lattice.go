// Unicode code-point Levenshtein lattice; exact path counts, not semantic evidence.
package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"math/big"
	"os"
	"unicode/utf8"
)

type Pair struct {
	Source string `json:"source"`
	Target string `json:"target"`
}
type Edge struct {
	I    int    `json:"i"`
	J    int    `json:"j"`
	Kind string `json:"kind"`
	Text string `json:"text"`
}
type Result struct {
	Distance int    `json:"distance"`
	Paths    string `json:"paths"`
	Possible []Edge `json:"possible"`
	Forced   []Edge `json:"forced"`
}
type step struct {
	i, j, cost int
	kind       string
	char       rune
}
type cell struct {
	d         int
	ways, pre big.Int
}

// A concrete prefix/suffix-preserving edit script gives an upper bound.
func upper(a, b []rune) int {
	p, q := 0, 0
	for p < len(a) && p < len(b) && a[p] == b[p] {
		p++
	}
	for q < len(a)-p && q < len(b)-p && a[len(a)-1-q] == b[len(b)-1-q] {
		q++
	}
	return max(len(a), len(b)) - p - q
}
func lattice(p Pair, full bool) (Result, error) {
	a, b := []rune(p.Source), []rune(p.Target)
	n, m := len(a), len(b)
	if !utf8.ValidString(p.Source) || !utf8.ValidString(p.Target) || n > 10000 || m > 10000 {
		return Result{}, fmt.Errorf("invalid or oversized input")
	}
	bound := upper(a, b)
	if full {
		bound = max(n, m)
	}
	// All paths of cost <= bound satisfy |i-j| <= bound, including every optimum.
	rows := make([][]cell, n+1)
	lo := make([]int, n+1)
	total := 0
	for i := 0; i <= n; i++ {
		lo[i] = max(0, i-bound)
		hi := min(m, i+bound)
		if hi < lo[i] {
			continue
		}
		total += hi - lo[i] + 1
		if total > 1000000 {
			return Result{}, fmt.Errorf("lattice cell limit")
		}
		rows[i] = make([]cell, hi-lo[i]+1)
	}
	at := func(i, j int) *cell {
		if i < 0 || i > n || j < lo[i] || j-lo[i] >= len(rows[i]) {
			return nil
		}
		return &rows[i][j-lo[i]]
	}
	next := func(i, j int) []step {
		s := make([]step, 0, 3)
		if i < n && j < m {
			k, c := "replace", 1
			if a[i] == b[j] {
				k, c = "keep", 0
			}
			s = append(s, step{i + 1, j + 1, c, k, b[j]})
		}
		if i < n {
			s = append(s, step{i + 1, j, 1, "delete", 0})
		}
		if j < m {
			s = append(s, step{i, j + 1, 1, "insert", b[j]})
		}
		return s
	}
	at(n, m).ways.SetInt64(1)
	for i := n; i >= 0; i-- {
		for j := lo[i] + len(rows[i]) - 1; j >= lo[i]; j-- {
			if i == n && j == m {
				continue
			}
			cur := at(i, j)
			cur.d = n + m + 1
			for _, s := range next(i, j) {
				z := at(s.i, s.j)
				if z == nil || z.ways.Sign() == 0 {
					continue
				}
				v := s.cost + z.d
				if v < cur.d {
					cur.d = v
					cur.ways.Set(&z.ways)
				} else if v == cur.d {
					cur.ways.Add(&cur.ways, &z.ways)
				}
			}
		}
	}
	root := at(0, 0)
	if root.ways.Sign() == 0 || root.d > bound {
		return Result{}, fmt.Errorf("invalid edit bound")
	}
	root.pre.SetInt64(1)
	r := Result{root.d, root.ways.String(), []Edge{}, []Edge{}}
	var through big.Int
	for i := 0; i <= n; i++ {
		for j := lo[i]; j < lo[i]+len(rows[i]); j++ {
			cur := at(i, j)
			if cur.pre.Sign() == 0 {
				continue
			}
			for _, s := range next(i, j) {
				z := at(s.i, s.j)
				if z == nil || z.ways.Sign() == 0 || s.cost+z.d != cur.d {
					continue
				}
				z.pre.Add(&z.pre, &cur.pre)
				if s.kind == "keep" {
					continue
				}
				t := ""
				if s.kind != "delete" {
					t = string(s.char)
				}
				e := Edge{i, j, s.kind, t}
				r.Possible = append(r.Possible, e)
				through.Mul(&cur.pre, &z.ways)
				if through.Cmp(&root.ways) == 0 {
					r.Forced = append(r.Forced, e)
				}
			}
		}
	}
	return r, nil
}
func main() {
	full := flag.Bool("full", false, "reference full grid")
	flag.Parse()
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 65536), 8*1024*1024)
	out := bufio.NewWriter(os.Stdout)
	defer out.Flush()
	enc := json.NewEncoder(out)
	for sc.Scan() {
		var p Pair
		if !utf8.Valid(sc.Bytes()) || json.Unmarshal(sc.Bytes(), &p) != nil {
			fmt.Fprintln(os.Stderr, "invalid JSON")
			os.Exit(1)
		}
		r, e := lattice(p, *full)
		if e != nil {
			fmt.Fprintln(os.Stderr, e)
			os.Exit(1)
		}
		if enc.Encode(r) != nil {
			os.Exit(1)
		}
	}
	if sc.Err() != nil {
		fmt.Fprintln(os.Stderr, sc.Err())
		os.Exit(1)
	}
}
