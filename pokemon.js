import AddPokemon from './AddPokemon.js';

// Register Game Settings
Hooks.once("ready", () => {
  game.settings.register("Pokemon5e-sheets", "enableTraining", {
    name: "Show Pokemon Tab",
    hint: "Toggling this on will display the pokemon tab on all player character sheets. You will need to close and reopen sheets for this to take effect.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
});
// The Meat And Potatoes
async function addPokemonTab(app, html, data) {

  // Fetch Setting
  let showPokemonTab = game.settings.get("Pokemon5e-sheets", "enableTraining");

  if (showPokemonTab){
    // Make sure flags exist if they don't already
    let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
    if (actor.data.flags['Pokemon5e-sheets'] === undefined) {
      let partyList = [];
      let pcList = [];
      let pokeSlotMax = 3;
      let saveLocation = 'party';
      const flags = {partyItems: partyList, pcItems: pcList, slotMax: pokeSlotMax, location: saveLocation};
      actor.data.flags['Pokemon5e-sheets'] = flags;
      actor.update({'flags.Pokemon5e-sheets': flags});
    }

    // Update the nav menu
    let pokemonTabBtn = $('<a class="item" data-tab="pokemon">' + "Pokemon" + '</a>');
    let tabs = html.find('.tabs[data-group="primary"]');
    tabs.append(pokemonTabBtn);

    // Create the tab content
    let sheet = html.find('.sheet-body');
    let pokemonTabHtml = $(await renderTemplate('modules/Pokemon5e-sheets/templates/pokemon-section.html', data));
    sheet.append(pokemonTabHtml);

    // Check for Tidy5e and add listener for delete lock
    let tidy5eSheetActive = (game.modules.get("tidy5e-sheet") !== undefined) && (game.modules.get("tidy5e-sheet").active);
    if (tidy5eSheetActive){
      html.find('.tidy5e-delete-toggle').click(async (event) => {
        event.preventDefault();
        let actor = game.actors.entities.find(a => a.data._id === data.actor._id);;
        if(actor.getFlag('tidy5e-sheet', 'allow-delete')){
          await actor.unsetFlag('tidy5e-sheet', 'allow-delete');
        } else {
          await actor.setFlag('tidy5e-sheet', 'allow-delete', true);
        }
      });
    }

    // Add New Pokemon to Party
    html.find('.party-add').click(async (event) => {
      event.preventDefault();
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      if (flags.partyItems == undefined){
        flags.partyItems = [];
      }
      if (flags.partyItems.length == undefined || flags.partyItems.length < flags.slotMax) {
        flags.location = 'party';
        let Aprompt = new AddPokemon()
        Aprompt.SetTrainer(actor);
        Aprompt.render(true);
      }
      else {
        let dialogContent = await renderTemplate('modules/Pokemon5e-sheets/templates/full-pokemon-dialog.html');
        new Dialog({
          title: `Can't Add Pokemon`,
          content: dialogContent,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Close`,
            }
          },
          default: "yes",
          close: html => {}
        }).render(true);
      }
    });

    // Add New Pokemon to PC
    html.find('.pc-add').click(async (event) => {
      event.preventDefault();
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      if (flags.pcItems == undefined){
        flags.pcItems = [];
      }
      flags.location = 'pc';
      let Aprompt = new AddPokemon()
      Aprompt.SetTrainer(actor);
      Aprompt.render(true);
    });

    // Remove Pokemon from Party
    html.find('.party-delete').click(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      let pokemonIdx = parseInt(fieldId.replace('delete-',''));
      let del = false;
      let dialogContent = await renderTemplate('modules/Pokemon5e-sheets/templates/delete-pokemon-dialog.html');
      new Dialog({
        title: `Release Pokemon?`,
        content: dialogContent,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Release`,
            callback: () => del = true
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel`,
            callback: () => del = false
          },
        },
        default: "no",
        close: html => {
          if (del) {
            flags.partyItems.splice(pokemonIdx, 1);
            actor.update({'flags.Pokemon5e-sheets': null}).then(function(){
              actor.update({'flags.Pokemon5e-sheets': flags});
            });
          }
        }
      }).render(true);
    });

    // Remove Pokemon from PC
    html.find('.pc-delete').click(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      let pokemonIdx = parseInt(fieldId.replace('delete-',''));
      let del = false;
      let dialogContent = await renderTemplate('modules/Pokemon5e-sheets/templates/delete-pokemon-dialog.html');
      new Dialog({
        title: `Release Pokemon`,
        content: dialogContent,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Release`,
            callback: () => del = true
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel`,
            callback: () => del = false
          },
        },
        default: "no",
        close: html => {
          if (del) {
            flags.pcItems.splice(pokemonIdx, 1);
            actor.update({'flags.Pokemon5e-sheets': null}).then(function(){
              actor.update({'flags.Pokemon5e-sheets': flags});
            });
          }
        }
      }).render(true);
    });

    // Move Pokemon to PC
    html.find('.party-pc').click(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      let pokemonIdx = parseInt(fieldId.replace('pc-',''));
      let newPoke = {
        name: 'New Pokemon',
        actor: undefined
      };
      if (flags.pcItems == undefined){
        flags.pcItems = [];
      }
      let mov = false;
      let dialogContent = await renderTemplate('modules/Pokemon5e-sheets/templates/move-pokemon-dialog.html');
      new Dialog({
        title: `Move Pokemon`,
        content: dialogContent,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Move to PC`,
            callback: () => mov = true
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Leave in Party`,
            callback: () => mov = false
          },
        },
        default: "no",
        close: html => {
          if (mov) {
            newPoke.name = flags.partyItems[pokemonIdx].name;
            newPoke.actor = flags.partyItems[pokemonIdx].actor;
            flags.pcItems.push(newPoke);
            flags.partyItems.splice(pokemonIdx, 1);
            actor.update({'flags.Pokemon5e-sheets': null}).then(function(){
              actor.update({'flags.Pokemon5e-sheets': flags});
            });
          }
        }
      }).render(true);
    });

    // Move Pokemon to party
    html.find('.pc-party').click(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      let pokemonIdx = parseInt(fieldId.replace('pc-',''));
      let newPoke = {
        name: 'New Pokemon',
        actor: undefined
      };
      let mov = false;
      if (flags.partyItems.length == undefined || flags.partyItems.length < flags.slotMax) {
      if (flags.partyItems == undefined){
        flags.partyItems = [];
      }
      let dialogContent = await renderTemplate('modules/Pokemon5e-sheets/templates/move-pokemon-dialog.html');
      new Dialog({
        title: `Move Pokemon`,
        content: dialogContent,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Move to Party`,
            callback: () => mov = true
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Leave in PC`,
            callback: () => mov = false
          },
        },
        default: "no",
        close: html => {
          if (mov) {
            newPoke.name = flags.pcItems[pokemonIdx].name;
            newPoke.actor = flags.pcItems[pokemonIdx].actor;
            flags.partyItems.push(newPoke);
            flags.pcItems.splice(pokemonIdx, 1);
            actor.update({'flags.Pokemon5e-sheets': null}).then(function(){
              actor.update({'flags.Pokemon5e-sheets': flags});
            });
          }
        }
      }).render(true);
    } else {
      let dialogContent = await renderTemplate('modules/Pokemon5e-sheets/templates/full-pokemon-dialog.html');
      new Dialog({
        title: `Can't Move Pokemon`,
        content: dialogContent,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Close`,
          }
        },
        default: "yes",
        close: html => {}
      }).render(true);
    }
    });

    // Set Pokemon Tab as Active
    html.find('.tabs .item[data-tab="pokemon"]').click(ev => {
      app.activatePokemonTab = true;
    });

    // Unset Pokemon Tab as Active
    html.find('.tabs .item:not(.tabs .item[data-tab="pokemon"])').click(ev => {
      app.activatePokemonTab = false;
    });

    // Edit Poke Slot Value
    html.find('.pokemon-override').change(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let field = event.currentTarget;
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      let pokemonIdx = parseInt(fieldId.replace('override-',''));

      if(isNaN(field.value)){
        // do nothing
      } else if(field.value.charAt(0)=="+"){
        var val = parseInt(field.value.substr(1).trim());
        flags.slotMax += val;
      } else if (field.value.charAt(0)=="-"){
        var val = parseInt(field.value.substr(1).trim());
        flags.slotMax -= val;
      } else {
        flags.slotMax = parseInt(field.value);
      }
      actor.update({'flags.Pokemon5e-sheets': null}).then(function(){
        actor.update({'flags.Pokemon5e-sheets': flags});
      });
    });

    // Edit Party Pokemon XP
    html.find('.party-xp').change(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let field = event.currentTarget;
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      let pokemonIdx = parseInt(fieldId.replace('xp-',''));
      if(isNaN(field.value)){
        // do nothing
      } else if(field.value.charAt(0)=="+"){
        var val = parseInt(field.value.substr(1).trim());
        flags.partyItems[pokemonIdx].actor.data.details.xp.value += val;
      } else if (field.value.charAt(0)=="-"){
        var val = parseInt(field.value.substr(1).trim());
        flags.partyItems[pokemonIdx].actor.data.details.xp.value -= val;
      } else {
        flags.partyItems[pokemonIdx].actor.data.details.xp.value = field.value;
      }
      let pActor = game.actors.get(flags.partyItems[pokemonIdx].actor._id);
      pActor.update(flags.partyItems[pokemonIdx].actor);
      flags.partyItems[pokemonIdx].actor = pActor;
      actor.update({'flags.Pokemon5e-sheets': null}).then(function(){
        actor.update({'flags.Pokemon5e-sheets': flags});
      });
    });

    // Edit PC Pokemon XP
    html.find('.pc-xp').change(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let field = event.currentTarget;
      let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let flags = actor.data.flags['Pokemon5e-sheets'];
      let pokemonIdx = parseInt(fieldId.replace('xp-',''));
      if(isNaN(field.value)){
        // do nothing
      } else if(field.value.charAt(0)=="+"){
        var val = parseInt(field.value.substr(1).trim());
        flags.pcItems[pokemonIdx].actor.data.details.xp.value += val;
      } else if (field.value.charAt(0)=="-"){
        var val = parseInt(field.value.substr(1).trim());
        flags.pcItems[pokemonIdx].actor.data.details.xp.value -= val;
      } else {
        flags.pcItems[pokemonIdx].actor.data.details.xp.value = field.value;
      }
      let pActor = game.actors.get(flags.pcItems[pokemonIdx].actor._id);
      pActor.update(flags.pcItems[pokemonIdx].actor);
      flags.pcItems[pokemonIdx].actor = pActor;
      actor.update({'flags.Pokemon5e-sheets': null}).then(function(){
        actor.update({'flags.Pokemon5e-sheets': flags});
      });
    });

    html.find('.notes').click(async (event) => {
      event.preventDefault();
      let fieldId = event.currentTarget.id;
      let field = event.currentTarget;
      field.classList.toggle("active");
      var panel = field.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  }
}

Hooks.on(`renderActorSheet`, (app, html, data) => {
  addPokemonTab(app, html, data).then(function(){
    if (app.activatePokemonTab) {
      app._tabs[0].activate("pokemon");
    }
  })
});
