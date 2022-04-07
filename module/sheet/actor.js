
export class ShinobigamiActor extends Actor {

  prepareData() {
    super.prepareData();

  }

  /** @override */
  async _preUpdate(data, options, userId) {
    console.log(data);

    if ('data' in data && ('talent' in data.data || ('health' in data.data && 'state' in data.data.health)) ) {
      let health = JSON.parse(JSON.stringify(this.data.data.health.state));
      let table = JSON.parse(JSON.stringify(this.data.data.talent.table));
      let gap = JSON.parse(JSON.stringify(this.data.data.talent.gap));

      let overflowX = this.data.data.talent.overflowX;
      let overflowY = this.data.data.talent.overflowY;

      if ('talent' in data.data) {
        if ('table' in data.data.talent) {
          for (let a = 0; a < Object.keys(data.data.talent.table).length; ++a) {
            let i = Object.keys(data.data.talent.table)[a];
            for (let b = 0; b < Object.keys(data.data.talent.table[i]).length; ++b) {
              let j = Object.keys(data.data.talent.table[i])[b];
              for (let c = 0; c < Object.keys(data.data.talent.table[i][j]).length; ++c) {
                let key = Object.keys(data.data.talent.table[i][j])[c];
                table[i][j][key] = data.data.talent.table[i][j][key];
              }
            }
          }

        }

        if ('gap' in data.data.talent) {
          for (let a = 0; a < Object.keys(data.data.talent.gap).length; ++a) {
            let i = Object.keys(data.data.talent.gap)[a];
            gap[i] = data.data.talent.gap[i];
          }
        }

        if ('curiosity' in data.data.talent && data.data.talent.curiosity != 0) {
          gap = data.data.talent.gap = {"0": false, "1": false, "2": false, "3": false, "4": false, "5": false};

          data.data.talent.gap[data.data.talent.curiosity] = gap[data.data.talent.curiosity] = true;
          data.data.talent.gap[data.data.talent.curiosity - 1] = gap[data.data.talent.curiosity - 1] = true;
        }

        if ('overflowX' in data.data.talent)
          overflowX = data.data.talent.overflowX;
        if ('overflowY' in data.data.talent)
          overflowY = data.data.talent.overflowY;
      }

      if ('health' in data.data) {
        for (let a = 0; a < Object.keys(data.data.health.state).length; ++a) {
          let i = Object.keys(data.data.health.state)[a];
          health[i] = data.data.health.state[i];
        }
        data.data.talent = {};
      }
      data.data.talent.table = this._getTalentTable(table, gap, health, overflowX, overflowY);
    }

    super._preUpdate(data, options, userId);
  }

  _getTalentTable(table, gap, health, overflowX, overflowY) {
    let nodes = [];
    
    for (var i = 0; i < 6; ++i)
    for (var j = 0; j < 11; ++j) {
      if (table[i][j].state == true && table[i][j].stop == false && health[i] == false) {
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
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "<h2><b>" + title + "</b></h2>"
    };

    let rollMode = (secret) ? "gmroll" : game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    let formula = "2d6";
    if (add != null)
      formula += (add < 0) ? `${add}` : `+${add}`
    let roll = new Roll(formula);
    await roll.roll();
    let d = roll.terms[0].total;
    
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

    if (game.dice3d) {
        game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));;
    } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
    }
  }

}
