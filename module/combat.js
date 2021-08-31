import { PlotDialog } from "./dialog/plot-dialog.js";

export class PlotCombat extends Combat {

  /** @override */
  async rollAll(options) {
    const list = this.combatants.reduce((actors, c) => {
      if (c.isOwner && !c.initiative)
        actors.push({ actorId: c.actor.id, combatantId: c.id, name: c.name });
      return actors;
    }, []);

    Hooks.call("initPlot", list);
    Hooks.call("spreadPlot");
    return true;
  }

  /** @override */
  async rollNPC(options={}) {
    const list = this.combatants.reduce((actors, c) => {
      if (c.isOwner && c.isNPC && !c.initiative)
        actors.push({ actorId: c.actor.id, combatantId: c.id, name: c.name });
      return actors;
    }, []);

    Hooks.call("initPlot", list);
    Hooks.call("spreadPlot");
    return true;
  }

}
