# Git Learning Log — DocPilot Project

> A running log of Git concepts learned while building DocPilot. Updated as new concepts come up.

---

## Branches

A branch is a separate line of work. It lets you build something without touching the stable, working version of your code (`main`).

```powershell
# Create a new branch and switch to it in one step
git checkout -b day/02-qdrant-setup

# Switch to an existing branch
git checkout main
```

**Mental model:** Git tracks one "current branch" at a time, called `HEAD`. Whichever branch you're standing on, your files on disk match that branch's version of the code.

---

## Checkout vs Merge — How They Work Together

These two commands are easy to confuse because they seem related but do very different things.

**`checkout`** answers: *"Where am I standing?"*
It switches your working files to match a different branch.

**`merge`** answers: *"What do I want to bring to where I'm standing?"*
It takes commits from another branch and brings them into your **current** branch.

### The Golden Rule

> Always check out the **destination** branch first, then merge the **source** branch into it.

```powershell
git checkout main                    # stand on main (the destination)
git merge day/02-qdrant-setup        # bring day branch's work (the source) into main
git push origin main                 # publish main with the new work
```

### What happens if you do it backwards?

If you stay on `day/02-qdrant-setup` and run `git merge main`:
- This pulls `main`'s changes **into your day branch** — the opposite direction
- `main` itself is untouched — none of your day's work ends up there
- If `main` has nothing new (because your day branch is ahead), Git just says "Already up to date" — harmless

**Lesson:** the branch you're standing on is always the one that *receives* the merge.

---

## Everything Is Reversible (Until You Push)

This is the most important safety concept in Git.

**Nothing is permanent until you run `git push`.** Until then, every commit, every merge, every mistake exists only on your machine. You can undo almost anything.

### Undo an in-progress merge (conflict not yet resolved)

```powershell
git merge --abort
```

Cancels the merge mid-way and restores things to exactly how they were before you started.

### Undo a completed merge (already went through cleanly)

```powershell
git reset --hard HEAD~1
```

Moves your branch pointer back one commit — as if the merge never happened.
`HEAD~1` means "one commit before where I currently am." `HEAD~2` would mean two commits back, and so on.

⚠️ `--hard` discards changes, so only use this when you're sure you want to throw away the most recent commit/merge.

---

## Commit Strategy We're Using

Each logical unit of work = one commit. Not one giant commit per day.

```powershell
git add backend/app/core/config.py
git commit -m "feat(backend): pydantic-settings config reads from .env"

git add backend/app/core/qdrant.py
git commit -m "feat(backend): Qdrant client singleton and collection bootstrap"
```

**Why split commits like this?**
A reviewer (or future you) can look at one commit and understand exactly one change. If something breaks, you can find the exact commit that caused it instead of digging through a wall of unrelated changes.

### Commit message prefixes we use

| Prefix | Meaning |
|---|---|
| `feat(scope):` | New functionality |
| `fix(scope):` | Bug fix |
| `chore:` | Config, tooling, dependencies |
| `docs:` | README, comments |
| `test:` | Adding or updating tests |
| `refactor(scope):` | Restructuring code, no behaviour change |

---

## Daily Workflow (the pattern we repeat every day)

```powershell
# Start of day — branch off main
git checkout main
git pull
git checkout -b day/03-ingest-pipeline

# During the day — commit as you complete each piece
git add <file>
git commit -m "feat(...): ..."

# End of day — merge back into main
git checkout main
git merge day/03-ingest-pipeline
git push origin main
git push origin day/03-ingest-pipeline   # keep the day branch visible on GitHub too
```

---

## Terms Glossary

| Term | Meaning |
|---|---|
| `HEAD` | A pointer to whichever branch/commit you're currently standing on |
| Working directory | The actual files on your disk right now |
| Staging area | Files you've `git add`-ed, ready to be committed |
| Commit | A saved snapshot of staged changes, with a message |
| Branch | A named, movable pointer to a line of commits |
| Merge | Combining commits from one branch into another |
| Origin | The default name for your remote repository (GitHub) |

---

*This log will keep growing as new Git concepts come up during the build.*