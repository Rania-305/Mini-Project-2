# Mini-Project-2

Project Link: https://rania-305.github.io/Mini-Project-2/index.html

What the agent built that differs from what I expected:
- Something the agent built that differed from what I expected was the "Events Completed" header, which I don't believe I asked for in my proposal. Either way it was helpful but needed some adjusting. In the intial build, an event could have all tasks complete but there was no way to update the status to reflect that it had been completed. By implementing status dropdowns with the agent, I was able to create a better UX.


Pick one piece of AI output you did not accept as-is. What did it give you, what did you change, and how did you know it needed changing? Point at the commit.
- One AI output that I did not particularly love was the lack of detail in the budget section for the events. Dollar amounts could be added without specification of what the spend was for and even worse was that there was no way to remove a line item/budget entry. This could result in mistakes being added and being unable to be corrected. In my "Finishing Touches" commit, I worked with AI to correct this in a few ways. First, I asked AI to help me create a drop down so that users could select if the money was spent on food, supplies or something else they could specify. Additionally, we added the capability for the user to delete the line item which would also be taken out of the Budget totals.

If the agent produced acceptable output on the first attempt: what did you do to verify it?
- An example of where the agent produced an acceptable output but I stil verified it was in the intial calculations.js for the file. I ran it through Claude to look for any inconsistencies but also looked at the formulas myself to ensure that everything was being computed correctly to the extent of my knowledge.