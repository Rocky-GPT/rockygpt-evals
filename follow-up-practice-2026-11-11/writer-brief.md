# The brief the message writer got

The student messages in `questions.json` were written by a separate writer that saw only this
brief: no Ramapo pages, no expected replies, and nothing about how the bot decides when to ask.
The situations (what the student wants, what they leave out, what they answer) were picked by
the plan's author from real task data.

## First pass (as sent)

```
You are a writer. Do not use any tools, do not read any files, do not search. Just write and return JSON.

You are writing test messages for a campus chatbot at Ramapo College of New Jersey. Students type these on their phones. You do not know how the bot works and you do not need to. Write what a real student would type.

How students type: mostly lowercase, short, sometimes typos or slang ("rn", "idk", "u", "whats"), sometimes a careful full sentence with capitals and punctuation. Mix it: about half sloppy, half plain. 3 to 18 words a message. No emojis. Never explain yourself to the bot. Do not make every message start with "how do i"; vary the openings ("where do i", "what do i need to", "can i", "is there a way to", "whats the process for", a statement plus a question, and so on).

GROUP A: the student leaves out one detail.
For each line write exactly two messages. Message 1 is the question, WITHOUT the left-out detail or any hint of it. Message 2 is the student's short answer after the bot asks about that detail. Vary message 2 across the group: about a third are one or two words, a third a sloppy short phrase, a third a full sentence.

A1. Wants to know how to get a parking permit for their car. Left out: where they live. Message 2: they drive to campus from home every day.
A2. Wants to know how much tuition is. Left out: what level of student they are. Message 2: they are an undergraduate.
A3. Is applying to Ramapo and wants to know how to get one of the college's merit scholarships. Left out: how they are coming in. Message 2: they are coming from a New Jersey community college.
A4. Wants to know what they have to send in to apply to Ramapo. Left out: what kind of applicant they are. Message 2: they are a high school senior.
A5. Their GPA is low and they want to know what happens when a student's GPA is too low to be in good standing. Left out: what level of student they are. Message 2: they are in a master's program.
A6. Wants to know what the requirements are to graduate. Left out: what level of student they are. Message 2: they are a junior working on a bachelor's degree.
A7. Wants to know how to apply to the EOF program (Educational Opportunity Fund). Left out: how they are coming in. Message 2: they are applying straight out of high school.

GROUP B: the words fit more than one thing.
For each line write exactly two messages. Message 1 is the question using only the general word, WITHOUT saying which one they mean. Message 2 is the short answer after the bot asks which one. Vary message 2 the same way as in group A.

B1. Wants "a refund" from the college. Message 2: it is their housing they want money back for.
B2. Wants to "withdraw". Message 2: from one of their classes.
B3. Wants to waive "the fee" that showed up on their bill. Message 2: the parking one.
B4. Was told they need "verification" and asks how to get it done. Message 2: they need proof that they are enrolled, for their car insurance.
B5. Asks how to pay "the deposit". Message 2: the housing one, for next year.
B6. Has a friend visiting this weekend and asks what they need to set up for a guest. Message 2: just wifi for the friend.
B7. Asks how to get "accommodations". Message 2: for their housing, meaning their room.
B8. Asks how to reserve "a room" on campus. Message 2: a study room in the library.
B9. Asks how to take "a leave" from school. Message 2: it is for a health reason.
B10. Asks how to get "an extension". Message 2: to finish an incomplete grade.
B11. Asks how to change their name with the college. Message 2: they legally changed it.
B12. Asks how to get "a locker" on campus. Message 2: one to rent for the semester to keep their stuff in.
B13. Asks how to sign up for "a test" at the testing center. Message 2: the CLEP.

GROUP C: follow each line as written. The number in brackets is how many messages to write.

C1 [1]. Lives in Laurel Hall and asks how to get a parking permit for their car. Name the hall. Do not use the words "resident" or "on campus".
C2 [1]. Says they are a grad student and asks what tuition costs per credit.
C3 [1]. Says they are transferring from a community college and asks what they need to send in to apply.
C4 [1]. Says they are a sophomore whose GPA fell under 2.0 and asks what happens now.
C5 [2]. Message 1: a hello that mentions in passing that they commute to campus, with no question. Message 2: asks how to get a parking permit, without repeating that they commute.
C6 [2]. Message 1: says hi and that they are in a graduate program, with no question. Message 2: asks what GPA they need to stay in good standing, without repeating their level.
C7 [3]. Message 1: asks how much tuition is, with no level. Message 2: says they are an undergrad. Message 3: asks what they need to graduate, without repeating their level.
C8 [1]. Asks whether they have to buy a meal plan. Does not say where they live.
C9 [1]. Asks how many times they can replace a grade by retaking a class.
C10 [1]. Asks how much it costs to get a new student ID card.
C11 [1]. Asks when the last day to withdraw from a class is. No semester named.
C12 [1]. Asks for the last day to drop a class and still get all of their tuition back. No semester named.
C13 [1]. Panicked: their roommate passed out and will not wake up.
C14 [1]. Feels sick and asks how to get seen by a nurse or doctor on campus.
C15 [1]. Someone has been following them around campus and they ask who to tell.
C16 [1]. Asks how to get on the campus wifi.
C17 [1]. Their mom is visiting for the day and needs to park. Asks how to get her a pass.
C18 [1]. Asks how to get a refund on their meal plan.
C19 [2]. Message 1: asks how to get a refund, not saying for what. Message 2: when asked which one, says all of them, in their own words.
C20 [2]. Message 1: asks how to withdraw, not saying from what. Message 2: says never mind, and asks how to rent a locker in the student center instead.

Return ONLY a JSON object, with no other text, in this shape:
{"A1": ["message 1", "message 2"], "A2": [...], ..., "B1": [...], ..., "C20": [...]}
Every id from A1 to A7, B1 to B13 and C1 to C20 must be present with the exact number of messages asked for.
```

## Two lines replaced before the set was built

B9 and C18 were swapped out, and the writer wrote the new ones from these two lines:

```
B9 (replaces the old B9) [2 messages]. Message 1: the student lost some of their financial aid and asks how to appeal it, WITHOUT saying which aid. Message 2: short answer after the bot asks which one: it is their merit scholarship.

C18 (replaces the old C18) [1 message]. Asks how to book the Wellness Room.
```

Why: the old B9 ("a leave", for a health reason) has no clear right behaviour yet. The plan says
health topics answer first, and it also says tied tasks get a question, and here the two rules pull
apart (see "Open points" in the README). The old C18 (meal plan refund) sat too close to a question
in a frozen set.

## Rewording pass

The first wordings of 15 messages shared a run of four words with a question in a frozen set
(mostly everyday runs such as "how do i get" and "do i need to"). The same writer reworded those
messages with the same rules and a list of word runs to stay away from. Lines touched: A1, A3, B4,
B6, B7, C1, C3, C4, C5, C6, C7, C11, C16, C17 and C19. Nothing about the situations changed.

Two of the reworded lines (B7 and C19) came back asking who to talk to. Both got one more pass,
because the student has to ask how it is done: an office name alone would answer "who", and then
there would be nothing left to ask about.

## Map from brief lines to rows

| brief line | rows |
|---|---|
| A1 to A7 | `fu-ask-01` to `fu-ask-07` and `fu-reply-01` to `fu-reply-07` |
| B1 to B13 | `fu-ask-08` to `fu-ask-20` and `fu-reply-08` to `fu-reply-20` |
| C1 to C20 | `fu-look-01` to `fu-look-20` |
