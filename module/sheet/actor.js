
export class ShinobigamiActor extends Actor {

  prepareData() {
    super.prepareData();

  }

  /** @override */
  async _preUpdate(data, options, userId) {
    if ('system' in data && ('talent' in data.system || 'health' in data.system) ) {
      let health = JSON.parse(JSON.stringify(this.system.health.state));
      let dirty = JSON.parse(JSON.stringify(this.system.health.dirty));
      let table = JSON.parse(JSON.stringify(this.system.talent.table));
      let gap = JSON.parse(JSON.stringify(this.system.talent.gap));

      let overflowX = this.system.talent.overflowX;
      let overflowY = this.system.talent.overflowY;
      let yoma = this.system.talent.yoma;


      console.log(data);

      if ('talent' in data.system) {
        if ('table' in data.system.talent) {
          for (let a = 0; a < Object.keys(data.system.talent.table).length; ++a) {
            let i = Object.keys(data.system.talent.table)[a];
            for (let b = 0; b < Object.keys(data.system.talent.table[i]).length; ++b) {
              let j = Object.keys(data.system.talent.table[i])[b];
              for (let c = 0; c < Object.keys(data.system.talent.table[i][j]).length; ++c) {
                let key = Object.keys(data.system.talent.table[i][j])[c];
                table[i][j][key] = data.system.talent.table[i][j][key];
              }
            }
          }

        }

        if ('gap' in data.system.talent) {
          for (let a = 0; a < Object.keys(data.system.talent.gap).length; ++a) {
            let i = Object.keys(data.system.talent.gap)[a];
            gap[i] = data.system.talent.gap[i];
          }
        }

        if ('curiosity' in data.system.talent && data.system.talent.curiosity != 0) {
          gap = data.system.talent.gap = {"0": false, "1": false, "2": false, "3": false, "4": false, "5": false};

          data.system.talent.gap[data.system.talent.curiosity] = gap[data.system.talent.curiosity] = true;
          data.system.talent.gap[data.system.talent.curiosity - 1] = gap[data.system.talent.curiosity - 1] = true;
        }

        if ('overflowX' in data.system.talent)
          overflowX = data.system.talent.overflowX;
        if ('overflowY' in data.system.talent)
          overflowY = data.system.talent.overflowY;
        if ('yoma' in data.system.talent)
          yoma = data.system.talent.yoma;

      } else
        data.system.talent = {};

      if ('health' in data.system && ('state' in data.system.health || 'dirty' in data.system.health)) {
        let count = 0;
        // fix fvtt v11 -> v12
        if ('dirty' in data.system.health) {
          for (let a = 0; a < Object.keys(data.system.health.dirty).length; ++a) {
            const i = Object.keys(data.system.health.dirty)[a];
            const prev = !!(this.system.health.dirty?.[i]);
            const next = !!data.system.health.dirty[i];
            dirty[i] = next;
            if (prev !== next) count += (next ? -1 : +1);
          }
        }

        // fix fvtt v11 -> v12
        if ('state' in data.system.health) {
          for (let a = 0; a < Object.keys(data.system.health.state).length; ++a) {
            const i = Object.keys(data.system.health.state)[a];
            const prev = !!(this.system.health.state?.[i]);
            const next = !!data.system.health.state[i];
            health[i] = next;
            if (prev !== next) count += (next ? -1 : +1);
          }
        }

        // fix fvtt v11 -> v12
        {
          const base = ('value' in data.system.health)
            ? Number(data.system.health.value ?? this.system.health.value)
            : this.system.health.value;
          const minV = this.system.health.min;
          const maxV = this.system.health.max;
          data.system.health.value = Math.max(minV, Math.min(maxV, base + count));
        }
      }

      if (!yoma) {
        for (let a = 0; a < Object.keys(dirty).length; ++a) {
          let i = Object.keys(dirty)[a];
          health[i] = dirty[i] ? dirty[i] : health[i];
        }
      } else
        health = {0: false, 1: false, 2: false, 3: false, 4: false, 5: false}

      data.system.talent.table = this._getTalentTable(table, gap, health, overflowX, overflowY);
    }

    super._preUpdate(data, options, userId);
  }

  _getTalentTable(table, gap, health, overflowX, overflowY) {
    let nodes = [];
    
    for (var i = 0; i < 6; ++i)
    for (var j = 0; j < 11; ++j) {
      if (table[i][j].state == true && table[i][j].stop == false && (health[i] == false || table[i][j].expert == true)) {
        nodes.push({x: i, y: j});
        table[i][j].num = "5";
      } else
        table[i][j].num = "12";
    }

    let dx = [0, 0, 1, -1];
    let dy = [1, -1, 0, 0];
    let move = [1, 1, 2, 2];
    for (var i = 0; i < nodes.length; ++i) {
      let queue = [nodes[i]];

      while (queue.length != 0) {
        let now = queue[0];
        queue.shift();
        
        if (+table[now.x][now.y].num == 12)
          continue;

        for (var d = 0; d < 4; ++d) {
          var nx = now.x + dx[d];
          var ny = now.y + dy[d];
          var m = move[d];

          if (overflowX && (nx < 0 || nx >= 6) )
            nx = (nx < 0) ? 5 : 0;
          if (overflowY && (ny < 0 || ny >= 11) )
            ny = (ny < 0) ? 10 : 0;
          
          if (nx < 0 || nx >= 6 || ny < 0 || ny >= 11)
            continue;

          let g = ( (now.x == 0 && nx == 5) || (now.x == 5 && nx == 0) ) ? gap[0] : gap[(nx > now.x) ? nx : now.x];
          if (m == 2 && g)
            m = 1;

          if (Number(table[nx][ny].num) > Number(table[now.x][now.y].num) + m) {
            table[nx][ny].num = String(Number(table[now.x][now.y].num) + m);
            queue.push({x: nx, y: ny});
          }
        }
      }
    }

    return table;
  }

  async rollTalent(title, num, add, secret) {
    if (!add) {
      this._onRollDice(title, num, null, secret); 
      return;
    }
    
    new Dialog({
        title: "Please put the additional value",
        content: `<p><input type='text' id='add'></p><script>$("#add").focus()</script>`,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirm",
            callback: () => this._onRollDice(title, num, $("#add").val(), secret)
          }
        },
        default: "confirm"
    }).render(true);
    
  }

  async _onRollDice(title, num, add, secret) {
    
    // GM rolls.
    let chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        sound: CONFIG.sounds.dice,
        flavor: "<h2><b>" + title + "</b></h2>"
    };

    chatData.rollMode = (secret) ? "gmroll" : game.settings.get("core", "rollMode");
    if ( ["gmroll", "blindroll"].includes(chatData.rollMode) ) {
      chatData.whisper = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
    }
    else if ( chatData.rollMode === "selfroll" ) chatData.whisper = [game.user.id];
    else if ( chatData.rollMode === "publicroll" ) chatData.whisper = [];
    chatData.blind = chatData.rollMode === "blindroll";

    let formula = "2d6";
    if (add != null)
      formula += (add < 0) ? `${add}` : `+${add}`
    let roll = new Roll(formula);
    await roll.roll({async: true});
    let d = roll.terms[0].total;

    chatData.roll = roll;
    chatData.content = await renderTemplate("systems/shinobigami/templates/roll.html", {
      formula: roll.formula,
      flavor: null,
      user: game.user.id,
      tooltip: await roll.getTooltip(),
      total: Math.round(roll.total * 100) / 100,
      special: d == 12,
      fumble: d == 2,
      num: num
    });

    ChatMessage.create(chatData);

  }

}
