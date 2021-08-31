import { PlotDialog } from "./dialog/plot-dialog.js";

export class PlotCombat extends Combat {

  /** @override */
  async rollAll(options) {
    const actors = this.combatants.reduce((actors, c) => {
      if (c.isOwner && !c.initiative) {
        let a = c.actor;
        a.combatId = c.id;
        actors.push(a);
      }
      return actors;
    }, []);

    let combatActors = actors.map(i => ({id: i.id, combatId: i.combatId}));
    await actors.forEach(actor => actor.setFlag("shinobigami", "plot", {state: false, dice: []}));

    for (let actor of actors) {
      let share = game.user.id;
      for (let user of game.users)
        if (user.active && user.character != null && user.character.id === actor.id) {
            share = user.id;
            break;
        }

      if (share == game.user.id)
          new PlotDialog(actor, actors, true).render(true);
      else
          game.socket.emit("system.shinobigami", {share, data: {combatId: actor.combatId, actors: combatActors, combat: true}});
    }
    return true;
  }

  /** @override */
  async rollNPC(options={}) {
    const actors = this.combatants.reduce((actors, c) => {
      if (c.isOwner && c.isNPC && !c.initiative) {
        let a = c.actor;
        a.combatId = c.id;
        actors.push(a);
      }
      return actors;
    }, []);

    let combatActors = actors.map(i => ({id: i.id, combatId: i.combatId}));
    await actors.forEach(actor => actor.setFlag("shinobigami", "plot", {state: false, dice: []}));

    for (let actor of actors) {
      let share = game.user.id;
      for (let user of game.users)
        if (user.active && user.character != null && user.character.id === actor.id) {
            share = user.id;
            break;
        }

      if (share == game.user.id)
          new PlotDialog(actor, actors, true).render(true);
      else
          game.socket.emit("system.shinobigami", {share, data: {combatId: actor.combatId, actors: combatActors, combat: true}});
    }
    return true;
  }

}
