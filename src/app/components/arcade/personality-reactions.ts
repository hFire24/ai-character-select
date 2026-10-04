import type { Character } from '../../services/character.service';
import type { ReactionEvent } from './reactions';

// Explicit personality traits outrank hobby-based dialogue. Moe 10 has first priority.
export function personalityReactions(character: Character, event: ReactionEvent, points: number, ownTurn: boolean): string[] | null {
  const moods = (character.emotion || '').toLowerCase().split(/\s+/);
  if (character.moe === 10) {
    if (ownTurn) return event === 'bank' ? [
      `Ehehe, ${points}! I'm keeping them safe right here.`, `Little points, you're coming with me!`,
      `Look, look! I did it! Banking before I get carried away.`, `${points} points! Can I have a tiny victory cheer?`,
      `No sneaky dice stealing these back!`, `Hehe! I'll be brave again next turn.`
    ] : event === 'farkle' ? [
      `Aww! I trusted you, little dice!`, `Nooo, my points! Come back, please?`,
      `Pout. A very serious pout.`, `Can I trade this roll for a hug?`,
      `I got a little too excited, didn't I?`, `One tiny sulk, and then I'm ready again!`
    ] : [
      `I won?! Eeee! Somebody pinch me! Gently!`, `Happy little victory dance! You're all invited!`,
      `I'm trying to be humble, but my smile won't cooperate!`, `Can we do it again? Please?`,
      `I'm keeping this happy feeling all day!`, `Yay! Group hug? Even the dice can join.`
    ];
    return event === 'bank' ? [
      `Ooh, ${points}! That deserves a little clap!`, `You're doing so well! I have to catch up, hehe.`,
      `Those points look so cozy in your score.`, `Good choice! Losing them would make me pout for you.`,
      `I'll cheer for you... just a little. We're still rivals!`, `My turn to find some lucky little dice!`
    ] : event === 'farkle' ? [
      `Aww... those dice owe you an apology!`, `I'll cheer extra loud for your next turn!`,
      `Oh no! Emergency tiny hug?`, `Mean little dice. I'm giving them my sternest look.`,
      `Your points disappeared! I wanted to see you keep them...`, `That roll was just a rehearsal, okay?`
    ] : [
      `Yaaay! You won! I'm clapping with both hands!`, `Rematch after a victory hug?`,
      `I lost, but your happy face is worth it!`, `Aww, well played! Next time I'm catching you!`,
      `Let's play again, please!`, `You get the crown! I'll get it next round, hehe.`
    ];
  }
  if (moods.includes('calm')) {
    if (ownTurn) return event === 'bank' ? [
      `${points} points. A good place to pause.`, `I'll leave it there. No need to rush.`,
      `A little progress is enough for this turn.`, `These are worth keeping. I'll bank them.`,
      `I'm comfortable with that result.`, `One steady turn at a time.`
    ] : event === 'farkle' ? [
      `Ah, there it goes. We carry on.`, `That happens. I'll try again next turn.`,
      `I took the chance. It simply didn't work out.`, `My banked points are still there.`,
      `A breath, then another turn.`, `The dice don't owe me anything. It's all right.`
    ] : [
      `That was a pleasant game. Thank you.`, `A lovely result. Shall we play another?`,
      `I'm glad we took the time to play.`, `Steady turns worked out today.`,
      `I enjoyed that, right to the last roll.`, `Good company and a good game. I'm content.`
    ];
    return event === 'bank' ? [
      `${points} points. Nicely judged.`, `A sensible place to stop.`, `You're building a good score.`,
      `There's no need to gamble every turn.`, `Well played. Let's see what comes next.`, `Those points are safe now.`
    ] : event === 'farkle' ? [
      `An unlucky roll. There's still the next turn.`, `Take your time. No need to chase the loss.`,
      `We've all had a turn like that.`, `Your banked points are safe. That's something.`,
      `It was a reasonable chance to take.`, `Let that roll go. The next one starts fresh.`
    ] : [
      `Well played. A deserved win.`, `I enjoyed playing with you.`, `Another game whenever you're ready.`,
      `You kept your nerve. Nicely done.`, `Congratulations. That was a good match.`, `A good game, regardless of the result.`
    ];
  }
  if (moods.includes('joy') || moods.includes('joyful')) {
    if (ownTurn) return event === 'bank' ? [
      `${points}! Yes! I'm banking that!`, `Oh, that felt good! I'll stop while I'm smiling.`,
      `Look at that score grow!`, `That's a turn worth celebrating!`,
      `I want to roll again so badly... but I'm keeping these!`, `Points in the bank, grin on my face!`
    ] : event === 'farkle' ? [
      `Ahaha, I walked right into that one!`, `Nooo! That was a spectacular failure.`,
      `Nobody can say I didn't go for it!`, `So much for my brilliant plan!`,
      `Oops! Still having fun, though.`, `Okay, dice! You've had your laugh. My next turn's coming!`
    ] : [
      `YES! That last round was such a rush!`, `I won! We're definitely playing again!`,
      `What a finish! You made me work for that!`, `Victory! Give me a high five!`,
      `I'm going to be smiling about this for hours!`, `Who's ready for the rematch?`
    ];
    return event === 'bank' ? [
      `${points}! Nice! Now we've got a game going!`, `Great turn! I'm coming for that score!`,
      `I love it when the table gets competitive!`, `You made that look easy!`,
      `Solid bank! Let's see if I can top it!`, `You're on a roll! Figuratively, now that you've stopped.`
    ] : event === 'farkle' ? [
      `Oh no! I was getting excited for you!`, `That roll was wild! You'll get them next time!`,
      `Oof! I'm still cheering for you!`, `The dice are making this dramatic today!`,
      `I respect the attempt! You really went for it!`, `Shake it off! We've got more fun ahead!`
    ] : [
      `YES! What a finish! You earned that!`, `You won! High five before the rematch!`,
      `I want another round!`, `You had me on the edge of my seat!`,
      `Next game I'm giving you even more trouble!`, `I lost, but that was so much fun!`
    ];
  }
  return null;
}
