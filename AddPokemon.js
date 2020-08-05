import { PokemonData } from './pokemonSetting.js'
export default class AddPokemon extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true,
      popOut: true,
      editable: true,
      width: 500,
      height: 315,
      template: 'modules/Pokemon5e-sheets/templates/add-pokemon-dialog.html',
      id: 'add-pokemon',
      title: game.i18n.localize('Add New Pokemon'),
    });
  }

  /* -------------------------------------------- */

  getData() {
    return {
      others: game.actors.entities,
      trainer: undefined,
      save: false,
      opened: false,
      nickname: PokemonData.name,
      actor: PokemonData.actor,
    };
  }

  SetTrainer(tActor){
    this.trainer = tActor;
    this.opened = true;
  }

  SetPokemon(pActor){
    this.actor= pActor;
    PokemonData.actor = pActor;
    this.render(false);
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  async close() {
    if(this.save) {
      let newPoke = {
        name: this.nickname,
        actor: this.actor
      };
      let flags = this.trainer.data.flags['Pokemon5e-sheets'];
      if(flags.location === 'party') {
        if (flags.partyItems == undefined){
          flags.partyItems = [];
        }
        flags.partyItems.push(newPoke);
      } else if (flags.location === 'pc') {
        if (flags.pcItems == undefined){
          flags.pcItems = [];
        }
        flags.pcItems.push(newPoke);
      }
      this.save = false;
    }
    PokemonData.name ='';
    PokemonData.actor = undefined;
    this.trainer.update({diff:false});
    await super.close();
}

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {
    console.log("Event: ", event);
    console.log("Form Data: ", formData);
    Object.entries(formData).forEach(async ([key, val]) => {
      // Get Selected Pokemon
      if (event.type === 'change') {
        if (key.startsWith('actor') && val !== 'none'){
            this.SetPokemon(game.actors.get(val));
        } else if (key.startsWith('actor') && val === 'none'){
          this.actor= undefined;
          PokemonData.actor = undefined;
          this.render(false);
        }
        if (key.startsWith('nickname') && val !== ''){
            this.nickname = val;
            PokemonData.name = val;
        }
      }
      // If add button was clicked, send over linked pokemon and nickname
      if (event.type === 'submit' && event.isTrusted && this.opened) {
        this.save = true;
        this.opened = false;
        Object.values(ui.windows).forEach((val) => {
          if (val.id === 'add-pokemon') val.close();
        });
      } else {
        this.save = false;
      }
    });
  }
}
