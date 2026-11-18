# Tonight's checks before Release 1 (2026-11-02)

Two question sets. Nothing here changes code.

1. [professor/](professor/): 20 questions a Ramapo professor would likely try after Dan's email,
   in the `rocky bulk` format, with what a good answer says, checked on ramapo.edu.
   Run after the release:
   `./rocky bulk file rockygpt-evals/tonight-2026-11-02/professor/questions.txt --prod`
2. [blind-four-areas/](blind-four-areas/): a fresh 60-question blind set (people, events and clubs,
   academics, how-to), frozen with a sha256. Bar: 90% per area. Not run; waits for Dan's "run".
