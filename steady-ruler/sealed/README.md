# Sealed half of the steady ruler: do not open if you build or fix the bot

`sealed-half.json.enc` holds 150 questions with their answer key, encrypted so its text never shows
up in a search, a grep or a code review. `sealed-half.enc.sha256` is the hash of the encrypted file.

**If your job is to build, fix or tune RockyGPT (Brain, data, prompts, word rules), stop here.**
Do not decrypt it, do not ask anyone what is in it, and do not read a run's sealed results beyond
the totals. That is what keeps it a fair test: once a fixer has seen a question, it is a practice
question.

Only a thread whose job is to **run and grade** the ruler opens it, in its own scratch folder, and
deletes the plain copy when done. It reports totals only (see `../README.md`).

To open (run threads only):

```sh
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -md sha256 \
  -in steady-ruler/sealed/sealed-half.json.enc -out "$SCRATCH/sealed-half.json" \
  -pass file:/mnt/project-files/steady-ruler-sealed/passphrase.txt
```

The passphrase is not in any repo. It is in the project's shared files at
`/mnt/project-files/steady-ruler-sealed/passphrase.txt`. Be honest about what this is: a lock
against accidental reading, not against someone who decides to open it. The rule above is what
protects the test.

Fields are the same as the open half, plus `time_bound` (the answer depends on the day asked) and
`seen_fact` (an older practice question asked the same fact in other words; a run can report
these apart from the fully new ones).
