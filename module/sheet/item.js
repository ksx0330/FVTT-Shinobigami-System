
export class ShinobigamiItem extends Item {

  /** @override */
  async _preUpdate(data, options, userId) {
    if (data.type != "handout")
      super._preUpdate(data, options, userId);

    console.log(data);
    console.log(options);
    console.log(userId);
    console.log(this);

    if ("system" in data && "visible" in data.system) {
      if (!("ownership" in data))
        data.ownership = {};

      let visible = data.system.visible;
      for (const [k, v] of Object.entries(visible))
        data.ownership[k] = (v) ? 3 : 0;
    }

    super._preUpdate(data, options, userId);
  }

}