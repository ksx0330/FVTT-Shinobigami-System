
export class ActorItemToken extends Token {
    
  /** @override */
  async _canView(user, event) {
    console.log(this);

    if ( !this.actor ) {
      if (this.document.flags["shinobigami"] == undefined || this.document.flags["shinobigami"].uuid == undefined)
        ui.notifications.warn("TOKEN.WarningNoActor", {localize: true});

      const uuid = this.document.flags["shinobigami"].uuid;
      let item = await fromUuid(uuid);
      return item?.testUserPermission(user, "LIMITED");
    }
    return this.actor?.testUserPermission(user, "LIMITED");
  }

  /** @override */
  async _onClickLeft2(event) {

    let sheet;
    if (!this.actor) {
      const uuid = this.document.flags["shinobigami"].uuid;
      let item = await fromUuid(uuid);
      sheet = item.sheet;
    } else
      sheet = this.actor.sheet;

    if ( sheet.rendered ) {
      sheet.maximize();
      sheet.bringToTop();
    }
    else sheet.render(true, {token: this.document});
  }

}