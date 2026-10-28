# IFS Dependency Map, read as Rust

An interactive walkthrough of the Rust code in
[phbronson999/ifs-dependency-map](https://github.com/phbronson999/ifs-dependency-map), a desktop tool
that indexes IFS Cloud Core and Cust source into one dependency graph and flags problems.

**Read it here: https://catherinezetadrones-stack.github.io/ifs-dependency-map-rust-walkthrough/**

The walkthrough follows the data through the whole program, from the folder scan and parsers through name
resolution and the rules to the JSON the UI draws. Along the way it explains the Rust each step uses:
ownership and moves, borrowing, lifetimes, closures, trait objects, `Rc` and `RefCell`. The last stop
follows one real finding end to end.

## How it's built

`index.html` is generated. Each code block is copied by line number from the ifs-dependency-map source,
and links to the same lines on GitHub at the commit it was built from (shown at the top of the page).

This folder is meant to sit at `ifs-depmap/learn` inside a checkout of ifs-dependency-map, where that
repo's `.gitignore` leaves it out. To rebuild after the code changes:

```
cd ifs-depmap
node learn/build.mjs
```

The script stops if a line range no longer fits its file, or if an excerpted file has uncommitted changes
(the GitHub links would then show other lines).

- `walkthrough.src.html`: the walkthrough's text and which lines each code block shows
- `build.mjs`: fills in the code and writes `index.html`
