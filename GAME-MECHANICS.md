# Game mechanics

Enchantment (working title) is a free (for ever) browser based MMO. It's a dark world with evil magic, demons and necromancers battling each other for supremacy. To install and develop this game on your own server, see the source code [setup instructions](README.md).

## About the game

Mood of the game: a dark world with evil magic and demons. Greed is the creed, each player for himself.

Players can summon demons they need to slay in order to gain treasures. Players can also steal treasures from each other.

Every player can discover a new part of the world.

Each world area is first automatically generated when it is discovered, then players can modify the world with enslaved demons and materials gained in treasures.

Players don't fight each other directly: they can lay traps or summon demons within a certain distance.

At the start, each player starts with a few basic spells. Gaining new spells is part of the aims of the game.

Another aim is to is to expand one's domain and take control of other players domains.

The game is challenging and dangerous.

Battles are mostly magical but demons can inflict physical damage if they get within melee range of the character (not advisable to ever let that happen).

Demons are always aggressive to all and attack on sight.


## Skills

Player create only one character and spread points in these skills:

* Life: 3 to 70 (no maximum with equipment)
* Magic: 3 to 70 (with equipment, maximum is 100)
* Summoning: 3 to 70 (with equipment, maximum is 100)

There is no leveling and the only way to improve a character are:

* to gain treasures by defeating demons or
* stealing treasures stored somewhere by other players or
* stealing from the corpse of a player that hasn't come back fast enough to get the treasures left where he died.

### Life

There is no cap at 100 for life, so the maximum amount of life a Necromancer can have is unlimited, but at character creation it can't be higher than 70. Both physical and magical attacks will inflict damage on a character. When life hits 0, the character loses everything he is carrying and should do a corpse run to regain everything. When respawn, the Necromancer appear at a random place within his own domain or at a specific point anywhere in the world if he learnt the spell to bind himself and set where to respawn. If the Necromancer doesn't have control any domain, he respawns at any random point in the world. At respawn, the Necromancer only has 3 Life points and could easily be killed. He needs to quickly regain more Life points and recuperate his equipment from his corpse or it might get stolen after a set period of time by any other Necromancer.

Casting a spell doesn't use mana: it uses Life points, either from the character himself or from a sacrificial victim (human preferably, but animals will do).

Life doesn't regenerate by itself over time. It has to be taken from someone or something alive through a sacrifice ritual. A quick murder generate a small amount of Life for the character, whereas more elaborate rituals that involve time and pain will generate much more Life points.

### Magic

Strength of the non-summoning spells cast by the character. Ability to resist magical attacks. This is a percentage, therefore a skill of 100 means the character has a 100% chance of resisting magical attacks. At creation, the maximum is 70% chance of resisting magical attacks.

### Summoning

How likely is the summoning to be succesful and how powerful the demon is. All demons are aggressive, but they can be summoned far enough that they don't attack the summoner. Different demons have various agro range. The power of the demon is determined by the summoning score. The quality of his treasures, if defeated, gets better the more powerful the demon is. At character creation the summoning skill can't be higher than 70, the absolute maximum being 100.

## Fighting system

There are several types of fights.

### Summoning fighting system

This is a fight between a character trying to wrench a demon from Hell and place him in a place of his choosing. Demons don't want to be summoned: it's painful to them. Any demon will try to kill the necromancer who summoned him. 

Steps of the Summoning type of fight:

1. The necromancer begins a ritual. The longer the ritual, the less loss of Life points.
2. When the necromancer decides to end the ritual, a victim needs to be designated. The Necromancer needs to use a spell to torture and sacrifice ritually a human victim or 3 animals but that kind of spell doesn't cost much (typically just one Life point, which has to come from the Necromancer).
    1. The best victims are live human beings, because their spiritual and physical suffering during the ritual both increase the potential power of the summoned demon. Another advantage is that no Life is lost by the Necromancer. At the end of the ritual, the human sacrificial victim has to die. One human sacrificial victim is enough although the younger, the better.
    2. The second best victims are animals. They have no soul to torture but their physical anguish will allow the necromancer to summon a more powerful demon, and there again costing no Life to the Necromancer. At the end of the ritual, the animals being sacrificed have to die. Sacrificing one animal isn't enough, the Necromancer has to sacrifice at least 3 animals.
    3. The last and worst option is for the Necromancer to have to hurt himself to power his demon summoning. This won't improve the power of the demon that is being summoned because Necromancers have no soul and their cursed bodies can no longer feel pain. The Necromancer will also lose Life points, which weakens him just before his fight with the demon he is summoning. The necromancer loses Life equivalent to the spell cost to summon a specific demon.
3. The summoning has a chance to succeed based on a percentage from the Summoning skill of the Necromancer. The base percentage is the Summoning score of the Necromancer multiplied by 10. Equipment previously obtained may then adjust this base percentage by a few percent points and these modifiers are all added up. Sometimes the same equipment may have a penalty in Summoning as well as a bonus in another skill.
4. A virtual 100 die is thrown by the game. 
    1. If the die result is less or equal to the total Summoning base percentage and its modifiers, the demon is brought exactly where the Necromancer wanted him to appear.
    2. If the die result is more than the total Summoning score, the demon appear in a random point near the Necromancer.
5. As soon as the demon is close enough to the Necromancer he can use both melee and magical attacks. Necromancers are not well equipped against melee attacks from demons. Spells can offer some protection but these also cost Life and a melee fight is likely to be deadly for the Necromancer.
6. The summoned demon power and quality of his loot table are determined by the total score of that specific summoning. The exact choice of loot within that table and the number of items are completely random.
7. Note that a demon may be trapped and unable to attack the Necromancer. A smart Necromancer will prepare a prison or a place from which he can kill the demon without getting hurt. Demonic spells, like all spells, have a maximum range, so if placed far enough, the Necromancer can be completely safe from the demon attacks. In fact, a demon who is imprisoned won't be able to escape and a Necromancer could use this to his advantage and lay a trap for another Necromancer. As soon as a demon becomes free he will attack the nearest person, even if that person freed the demon from his cage. As soon as the demon has killed a human being or a Necromancer, he will return to Hell and leave the Necromancer who summoned him. Demons are not interested in attacking animals, they will always hunt down the nearest human being or Necromancer. Once a demon has latched onto a victim to chase, he won't switch unless someone else causes him a lot of injuries. A particularly smart Necromancer would trap another Necromancer and a demon together so that they become engaged in battle. Once they are both weak, the Necromancer can finish them off and collect the loot from the demon and try to prevent the naked Necromancer who just died to reach his corpse to retrieve his equipment. After a while the Necromancer can also loot the equipment of the other Necromancer who died. 


#### Note on looting

Looting demons is always free for all. First come, first served. Kill stealing is not against the rules of the game. Humans and animals never drop any loot, only demons do. It's also possible to steal from the expired corpse of another Necromancer or a treasure chest where a Necromancer has stored his belongings.


### Magic fighting system

Each spell cast against a demon or another Necromancer is a magical fight. 

Humans and animals, unless they have been enchanted by a Necromancer, will not offer any kind of resistance. Humans and animals are helpless victims when faced with the devastating powers of a Necromancer.

Inanimate objects may also be the target of a Necromancer spell. There again, they offer no resistance unless they have been enchanted.

Just like the summoning, for a spell to succeed, it has a dice roll below or equal to the Magic skill of the Necromancer multiplied by 10. This is the base score which is then adjusted based on modifiers from equipment.

The target of the spell, if it's a demon, a Necromancer or anything that is enchanted, has a chance to resist, based on his own Magic score but without any modifiers.

### Melee fighting system

 todo: document the rules of a melee fight.

### Domain fighting system

When a new character is created, he appears in a newly created domain, on the edge of at least one already discovered domain. The starting domain is therefore "discovered" by the newly made Necromancer and he can start enslaving the local popuplation of humans and animals to make them model the domain for him.

To own a domain, a Necromancer needs to enslave more humans and animals already living there to do his bidding.

If another Necromancer has already enslaved the local population, you can try to enslave more living creatures (humans and/or animals) than the current owner did, or easily kill whoever you find with a few spells. However, a Necromancer can also place protective enchantments, traps and demons in strategic positions, which can also make it difficult to take over the domain you are vying to control.

To get the slaves to build something or change the terrain, the Necromancer needs to acquire books of knowledge from the loot tables of demons. Summoning and fighting demons is the source of all useful equipment, spells and books of knowledge. The other source is to steal them from other other Necromancers. All Necromancers are playing characters.

Building is not done like in Minecraft, it's ready made models that get placed in the domain according to the books of knowledge the Necromancer has looted from demons.

### Newly created Necromancer

All Necromancers can:

- [summoning] summon a demon in a specific place, up to 30 metres from the Necromancer and within view. The type, strength and loot table of the demon is entirely based on the summoning skill, so is the chance of success to actually summon the demon and place him where the Necromancer chose to make him appear. Cost: 7 Life points if done quickly. If the ritual takes longer and isn't interupted, it can cost as little as just 1 Life point.
- [magic / spell] perform a simple ritual that sacrifices a human or three animals to generate Life. It costs 1 Life to cast and generates a minimum of 3 Life points if done quickly. Unless the Necromancer is interupted, this ritual never fails. If the ritual is prolonged, it can generate up to 7 Life points.
- [magic / spell] inflict instant pain from a distance of up to 10 metres, to a single target. This costs 1 Life to cast and inflicts 3 Life of damage to the target if successful. This is an attack based on the Magic skill.
- [magic / spell] absorb 2 Life points from a target at up to 10 metres. It costs 1 Life to cast this spell. The target is hurt and the Necromancer gains life only if the spell lands successfully and isn't resisted by the target.
- [magic / spell] enslave a human or an animal to perform certain basic actions in the environment. Can be cast on a target at up to 5 metres. Cost: 1 Life.
- [magic / spell] immobilize a human or an animal so they can't move. Can be cast on a target at up to 30 metres. Cost: 1 Life.





