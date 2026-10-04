import type { Character } from '../../services/character.service';
import { personalityReactions } from './personality-reactions';

export type ReactionEvent = 'bank' | 'farkle' | 'win';

// These are authored offline reactions, not generated AI dialogue.
export function characterReaction(character: Character, event: ReactionEvent, points: number,
  actor: string, ownTurn: boolean, previous: string[] = []): string {
  const personality = personalityReactions(character, event, points, ownTurn);
  if (personality) {
    const fresh = personality.filter(line => !previous.includes(line));
    const choices = fresh.length ? fresh : personality;
    return choices[Math.floor(Math.random() * choices.length)];
  }
  const profile = `${character.description || ''} ${character.interests || ''}`.toLowerCase();
  const music = character.musicEnjoyer || /music|rhythm|rave|dj\b/.test(profile);
  const magic = /magic|mage|spell|witch/.test(profile);
  const tech = character.futuristic >= 7 || /coding|programming|tech-savvy|gamer|video games/.test(profile);
  const shy = (character.emotion || '').toLowerCase().split(/\s+/).includes('shy')
    || /shy|quiet|timid|gentle/.test(profile);
  let lines: string[];
  if (!ownTurn) {
    lines = event === 'bank' ? [
      `${points} points? Okay, now I have something to chase.`,
      `Stopping there? I was hoping to see one more roll.`,
      `Banking ${points}. Sensible. Annoyingly sensible.`
    ] : event === 'farkle' ? [
      `That last roll was cruel. I was almost rooting for you.`,
      `${points ? `${points} points gone` : 'Not a single scoring die'}... I'm suddenly less tempted to push my luck.`,
      `I'll try not to look too relieved.`
    ] : [`Well played! I'm asking for a rematch.`, `Next game, I'm catching you.`];
    if (music) lines = event === 'farkle' ? [`That was a rough drop. Let's get the rhythm back.`, `The beat stopped before the chorus!`, `Those dice just killed the vibe.`] : event === 'bank' ? [`You're setting the tempo. Let me see if I can keep up.`, `${points} points? That's a pretty decent opening act.`, `Okay, I hear you. My set's coming next.`] : [`You headlined that game. I'll get you at the encore.`, `Great set! One more?`];
    if (magic) lines = event === 'farkle' ? [`Even a luck spell couldn't rescue that roll.`, `Perhaps I could lend you a luck charm next turn.`, `Those dice have a mischievous enchantment about them.`] : event === 'bank' ? [`Are you quite sure those dice aren't enchanted?`, `${points} points safely tucked away. A wise little spell.`, `I see fortune has taken a liking to you.`] : [`A well-earned victory. No spells required.`, `Next time, I'm bringing my luck charm.`];
    if (tech) lines = event === 'farkle' ? [`RNG really chose violence on that one.`, `That turn needs a restore-from-backup button.`, `Well, there goes the autosave.`] : event === 'bank' ? [`You're making this leaderboard inconvenient for me.`, `${points} points saved. That's a solid checkpoint.`, `Okay, challenge accepted. Let me load my next turn.`] : [`GG! I'm queueing for a rematch.`, `You topped the leaderboard. For now.`];
    if (shy) lines = [`${event === 'farkle' ? 'Oh... sorry. That was an unlucky roll.' : event === 'bank' ? `${points}... that's a good turn. I'll try to keep up.` : 'You won! That was... actually really fun.'}`];
  } else if (magic) {
    lines = event === 'bank' ? [`${points} points, safely sealed away. No more tempting fate.`, `I'll save these before the luck spell wears off.`, `A little fortune, carefully preserved.`]
      : event === 'farkle' ? [`That was not the spell I meant to cast.`, `${points ? `${points} points vanished` : 'No luck at all'}. Perhaps the dice are cursed.`, `I should have brought a better luck charm.`]
      : [`A most fortunate little adventure. Another round?`, `I promise the dice weren't enchanted. Mostly.`];
  } else if (tech) {
    lines = event === 'bank' ? [`Saving ${points} points. No rollback needed.`, `Checkpoint reached. Banking before I get greedy.`, `${points} secured. That's going on the leaderboard.`]
      : event === 'farkle' ? [`Well, that run crashed.`, `${points ? `${points} points lost` : 'Zero points'}. I'd like to file a bug report with the dice.`, `RNG, we need to have a conversation.`]
      : [`New high score! Who's queueing for a rematch?`, `GG! That was worth staying up for.`];
  } else if (shy) {
    lines = event === 'bank' ? [`I'll keep the ${points}, if that's okay.`, `That went better than I expected... I'll stop here.`, `I think that's enough luck for one turn.`]
      : event === 'farkle' ? [`Oh... I should have stopped earlier.`, `Could we pretend that roll didn't happen?`, `${points ? `All ${points} points...` : 'Not even one point...'} Oh dear.`]
      : [`I... won? Really? Thank you for playing with me.`, `That was lovely. Could we play again?`];
  } else if (character.straightforward) {
    lines = event === 'bank' ? [`${points}. Banked. I'm not risking it.`, `That's enough. Your turn.`, `I'll take a steady score over a dramatic exit.`]
      : event === 'farkle' ? [`Bad call. I should have banked.`, `${points} lost. Next turn.`, `Fine. The dice win this round.`]
      : [`Good game. Let's play again.`, `A win is a win. Who's next?`];
  } else if (music) {
    lines = event === 'bank' ? [`${points} points. Now that's a beat I can work with.`, `Bank it! I'm keeping this groove alive.`, `I'll leave that ${points}-point drop right there.`]
      : event === 'farkle' ? [`And the beat cuts out. ${points ? `${points} points, gone.` : 'Before it even started.'}`, `That roll was completely off-tempo.`, `Okay, the dice just unplugged my set.`]
      : [`That's my closing track! Who's up for an encore?`, `We brought the house down. Rematch?`];
  } else {
    lines = event === 'bank' ? [`${points} points! I'm stopping before my confidence gets expensive.`, `I could roll again... but I like having these points.`, `There. ${points} more reasons to watch out for me.`]
      : event === 'farkle' ? [`I knew that extra roll was a terrible idea. I did it anyway.`, `${points ? `${points} points!` : 'Nothing!'} The dice and I are no longer on speaking terms.`, `Nobody saw that. We're all agreed, right?`]
      : [`I'm going to enjoy this victory for at least a minute.`, `That was close! Same opponents, one more round?`];
  }
  const fresh = lines.filter(line => !previous.includes(line));
  const choices = fresh.length ? fresh : lines;
  return choices[Math.floor(Math.random() * choices.length)];
}
