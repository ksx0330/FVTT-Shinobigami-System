/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ShinobigamiActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["shinobigami", "sheet", "actor"],
      width: 850,
      height: 830,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skill"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/shinobigami/templates";
    return `${path}/${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    let isOwner = false;
    let isEditable = this.isEditable;
    let data = super.getData(options);
    let items = {};
    let actorData = {};

    isOwner = this.document.isOwner;
    isEditable = this.isEditable;

    data.lang = game.i18n.lang;
    data.userId = game.user.id
    data.isGM = game.user.isGM;

    // The Actor's data
    actorData = this.actor.toObject(false);
    data.actor = actorData;
    data.system = this.actor.system;
    data.system.isOwner = isOwner;

    data.items = Array.from(this.actor.items.values());
    data.items = data.items.map( i => {
      i.system.id = i.id;
      return i;
    });

    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

  
    let subTitle = {state: false, id: ""}
    if ("subTitle" in data.system.talent && data.system.talent.subTitle.state) {
      subTitle.id = data.system.talent.subTitle.id;
      subTitle.state = true;
    }

    data.system.tables = [];
    for (var i = 2; i <= 12; ++i) {
        data.system.tables.push({line: [], number: i});
        for (var j = 0; j < 6; ++j) {
            var name = String.fromCharCode(65 + j);
            data.system.tables[i - 2].line.push({ id: `col-${j}-${i-2}`, title: `Shinobigami.${name}${i}`, name: `system.talent.table.${j}.${i - 2}`, state: data.system.talent.table[j][i - 2].state, num: data.system.talent.table[j][i - 2].num, stop: data.system.talent.table[j][i - 2].stop, expert: data.system.talent.table[j][i - 2].expert, subTitle: (`col-${j}-${i-2}` == subTitle.id) ? true : false });
        }
    }


    data.system.tables = [];
    for (var i = 2; i <= 12; ++i) {
        data.system.tables.push({line: [], number: i});
        for (var j = 0; j < 6; ++j) {
            var name = String.fromCharCode(65 + j);
            data.system.tables[i - 2].line.push({ id: `col-${j}-${i-2}`, title: `Shinobigami.${name}${i}`, name: `system.talent.table.${j}.${i - 2}`, state: data.system.talent.table[j][i - 2].state, num: data.system.talent.table[j][i - 2].num, stop: data.system.talent.table[j][i - 2].stop, expert: data.system.talent.table[j][i - 2].expert, subTitle: (`col-${j}-${i-2}` == subTitle.id) ? true : false });
        }
    }

    actorData.abilityList = [];
    actorData.bondList = [];
    actorData.itemList = [];
    actorData.finishList = [];
    actorData.backgroundList = [];
    actorData.handoutList = [];

    for (let i of data.items) {
        if (i.type === 'ability')
            actorData.abilityList.push(i);
        else if (i.type == 'bond')
            actorData.bondList.push(i);
        else if (i.type == 'item')
            actorData.itemList.push(i);
        else if (i.type == 'finish')
            actorData.finishList.push(i);
        else if (i.type == 'background')
            actorData.backgroundList.push(i);
        else if (i.type == 'handout')
            actorData.handoutList.push(i);
    }
    
    data.enrichedBiography = await TextEditor.enrichHTML(data.system.details.biography, {async: true});

    console.log(data);

    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Talent
    html.find('.item-label').click(this._showItemDetails.bind(this));
    html.find(".echo-item").click(this._echoItemDescription.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find(".talent-name").on('mousedown', this._onRouteTalent.bind(this));
    html.find(".header-name").on('mousedown', async event => {
      if (event.button == 2 || event.which == 3) {
        let dataset = event.currentTarget.dataset;
        let num = dataset.num;
        let dirty = duplicate(this.actor.system.health.dirty);

        dirty[num] = !dirty[num];
        await this.actor.update({"system.health.dirty": dirty});
      }
    })

    // Owned Item management
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      let item = this.actor.items.get(li.data("itemId"));
      item.delete();
    });

    // Use Item
    html.find(".use-item").click(this._useItem.bind(this));

    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });

      html.find('.quantity-change').click(this._changeItemQuantity.bind(this));
    }

  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height;
    sheetBody.css("height", bodyHeight - 300);
    return position;
  }

  /* -------------------------------------------- */
  
  async _onRouteTalent(event) {
    if (event.button == 2 || event.which == 3)
      this._setStopTalent(event);
    else if (event.button == 1 || event.which == 2)
      this._setExpertTalent(event);
    else
      this._onRollTalent(event);
  }
  
  async _setStopTalent(event) {
    event.preventDefault();
    let table = duplicate(this.actor.system.talent.table);
    
    let dataset = event.currentTarget.dataset;
    let id = dataset.id.split("-");
    
    table[id[1]][id[2]].stop = !table[id[1]][id[2]].stop;
    await this.actor.update({"system.talent.table": table});
  }

  async _setExpertTalent(event) {
    event.preventDefault();
    let table = duplicate(this.actor.system.talent.table);
    
    let dataset = event.currentTarget.dataset;
    let id = dataset.id.split("-");
    
    table[id[1]][id[2]].expert = !table[id[1]][id[2]].expert;
    await this.actor.update({"system.talent.table": table});
  }
  
  async _onRollTalent(event) {
    event.preventDefault();
    let dataset = event.currentTarget.dataset;
    let num = dataset.num;
    let title = dataset.title;
    let add = true;
    let secret = false;
  
    if (!event.ctrlKey && !game.settings.get("shinobigami", "rollAddon"))
      add = false;

    if (event.altKey)
      secret = true;

    if (event.shiftKey) {
      let subTitle = this.actor.system.talent.subTitle;

      if (subTitle.state) {
        this.actor.update({"system.talent.subTitle.id": "", "system.talent.subTitle.title": "", "system.talent.subTitle.state": false});
        if (dataset.id != subTitle.id)
          title = subTitle.title + "->" + title;
        else
          return;

      } else {
        this.actor.update({"system.talent.subTitle.id": dataset.id, "system.talent.subTitle.title": title, "system.talent.subTitle.state": true});
        return;
      }
    }
    
    await this.actor.rollTalent(title, num, add, secret);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onDropActor(event, data) {
    if ( !this.actor.isOwner ) return false;

    const actor = await Actor.implementation.fromDropData(data);
    const actorData = actor.toObject();

    console.log(actor);

    const name = ``;
    const itemData = {
      name: actor.name,
      img: actor.img,
      type: "bond",
      system: {
        "actor": actor.id
      }
    };

    console.log(itemData);

    // Handle item sorting within the same Actor
    if ( this.actor.uuid === actor.parent?.uuid ) return this._onSortItem(event, itemData);

    // Create the owned item
    return this._onDropItemCreate(itemData);
  }
  
  /* -------------------------------------------- */
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;

    const name = `New ${type.capitalize()}`;
    let itemData = {
      name: name,
      type: type,
      system: {}
    };
    if (type == "handout")
      itemData.system.visible = {[game.user.id]: true};

    await this.actor.createEmbeddedDocuments('Item', [itemData], {});
  }

  _showItemDetails(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents('.item');
    const description = item.find('.item-description');

    toggler.toggleClass('open');
    description.slideToggle();
  }

  _echoItemDescription(event) {
    event.preventDefault();
    const itemDocument = $(event.currentTarget).parents('.item');
    const itemId = itemDocument[0].dataset.itemId;
    
    const item = this.actor.items.get(itemId);

    let title = item.name;
    let description = item.system.description;

    if (item.type == 'ability') {
      if (item.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Type")}</th>
                        <th>${game.i18n.localize("Shinobigami.Gap")}</th>
                        <th>${game.i18n.localize("Shinobigami.Cost")}</th>
                        <th>${game.i18n.localize("Shinobigami.Talent")}</th>
                      </tr>

                      <tr>
                        <td>${item.system.type}</td>
                        <td>${item.system.gap}</td>
                        <td>${item.system.cost}</td>
                        <td>${item.system.talent}</td>
                      </tr>
                    </table>${description}
                    <button type="button" class="roll-talent" data-talent="${item.system.talent}">${item.system.talent}</button>`
    }

    else if (item.type == 'bond') {
      if (item.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Residence")}</th>
                        <th>${game.i18n.localize("Shinobigami.Secret")}</th>
                        <th>${game.i18n.localize("Shinobigami.Finish")}</th>
                        <th>${game.i18n.localize("Shinobigami.Feeling")}</th>
                      </tr>

                      <tr>
                        <td>${(item.system.residence) ? "O" : "X"}</td>
                        <td>${(item.system.secret) ? "O" : "X"}</td>
                        <td>${(item.system.finish) ? "O" : "X"}</td>
                        <td>${item.system.feeling}</td>
                      </tr>
                    </table>${description}`
    }
    
    else if (item.type == 'background') {
      if (item.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Type")}</th>
                        <th>${game.i18n.localize("Shinobigami.RequireEXP")}</th>
                      </tr>

                      <tr>
                        <td>${(item.system.type == "pros") ? '<i class="fas fa-grin-alt"></i>' : '<i class="fas fa-frown"></i>'}</td>
                        <td>${item.system.exp}</td>
                      </tr>
                    </table>${description}`
    }
    
    else if (item.type == 'finish') {
      if (item.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Type")}</th>
                        <th>${game.i18n.localize("Shinobigami.Talent")}</th>
                      </tr>

                      <tr>
                        <td>${item.system.type}</td>
                        <td>${item.system.talent}</td>
                      </tr>
                    </table>${description}
                    <button type="button" class="roll-talent" data-talent="${item.system.talent}">${item.system.talent}</button>`
                    
      
    }
    
    else if (item.type == "item") {
      if (item.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.img}" width="40" height="40">&nbsp&nbsp<b>${title} X ${item.system.quantity}</b>` 
    }
    
    // GM rolls.
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="" data-actor-id=${this.actor.id} data-item-id=${itemId}>` + "<h2>" + title + "</h2>" + description + "</div>"
    };

    ChatMessage.create(chatData);

  }

  async _changeItemQuantity(event) {
    event.preventDefault();

    const chargeButton = $(event.currentTarget);
    const item = this.actor.items.get(chargeButton.parents('.item')[0].dataset.itemId);

    let add = Number(event.currentTarget.dataset.add);
    let num = Number(item.system.quantity);

    if (num + add < 0)
      return;

    await item.update({"system.quantity": num + add});

    add = (add > 0) ? "+" + add : add

    let chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: "<h3>" + item.name + ": " + add + "</h3>"
    };

    ChatMessage.create(chatData);
  }

  async _useItem(event) {
    event.preventDefault();
    const useButton = $(event.currentTarget);
    const item = this.actor.items.get(useButton.parents('.item')[0].dataset.itemId);

    if (item.system.quantity > 0) {
      await item.update({'system.quantity': item.system.quantity - 1});
  
      // GM rolls.
      let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: "<h3>" + game.i18n.localize("Shinobigami.UseItem") + ": " + item.name + "</h3>"
      };
  
      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
      if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
      if (rollMode === "blindroll") chatData["blind"] = true;
  
      ChatMessage.create(chatData);

    }
  
  }

  

}
