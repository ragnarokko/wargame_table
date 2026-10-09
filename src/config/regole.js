// Indice delle Core Rules di Warhammer 40,000 11a edizione. Contiene solo titoli e ancore della pagina
// di Wahapedia (nessun testo delle regole): ogni voce apre la sezione esatta sul sito. `it` è un nome
// italiano di comodo per la ricerca; `sezioni` sono le sottosezioni nell'ordine della pagina.
export const URL_REGOLE = 'https://wahapedia.ru/wh40k11ed/the-rules/core-rules/';

export const PARTI_REGOLE = [
  {
    titolo: 'Basic Rules',
    capitoli: [
      {
        id: 'Core-Concepts', numero: '01', titolo: 'Core Concepts', it: 'Concetti base',
        sezioni: [
          ['Armies', 'Armies'],
          ['Units-and-Models', 'Units and Models'],
          ['Active-Player-and-Opposing-Player', 'Active Player and Opposing Player'],
          ['Measuring-Distances', 'Measuring Distances'],
          ['Dice', 'Dice'],
          ['Leadership-Rolls', 'Leadership Rolls'],
          ['Battle-shock-Rolls', 'Battle-shock Rolls'],
        ],
      },
      { id: 'Datasheets', numero: '02', titolo: 'Datasheets', it: 'Schede unità', sezioni: [] },
      {
        id: 'Moving', numero: '03', titolo: 'Moving', it: 'Movimento',
        sezioni: [
          ['Moving-Units', 'Moving Units'],
          ['Set-Up', 'Set Up'],
          ['Coherency', 'Coherency'],
          ['Engagement', 'Engagement'],
        ],
      },
      {
        id: 'Making-Attacks', numero: '04', titolo: 'Making Attacks', it: 'Effettuare attacchi',
        sezioni: [
          ['1.-Select-Weapons', '1. Select Weapons'],
          ['2.-Select-Targets', '2. Select Targets'],
          ['3.-Resolve-Attacks', '3. Resolve Attacks'],
          ['Identical-Attacks', 'Identical Attacks'],
          ['Splitting-Melee-Attacks', 'Splitting Melee Attacks'],
        ],
      },
      {
        id: 'Attack-Sequence', numero: '05', titolo: 'Attack Sequence', it: 'Sequenza di attacco',
        sezioni: [
          ['1.-Hit-Roll', '1. Hit Roll'],
          ['2.-Wound-Roll', '2. Wound Roll'],
          ['3.-Save-Rolls', '3. Save Rolls'],
          ['4.-Inflict-Damage', '4. Inflict Damage'],
          ['Attack-Sequence-Examples', 'Attack Sequence Examples'],
        ],
      },
      {
        id: 'Other-Concepts', numero: '06', titolo: 'Other Concepts', it: 'Altri concetti',
        sezioni: [
          ['Visibility', 'Visibility'],
          ['Mortal-Wounds', 'Mortal Wounds'],
          ['Hazard-Rolls', 'Hazard Rolls'],
        ],
      },
    ],
  },
  {
    titolo: 'The Battle Round',
    capitoli: [
      {
        id: 'The-Battle-Round-1', numero: '07', titolo: 'The Battle Round', it: 'Il round di battaglia',
        sezioni: [
          ['1.-Start-of-Battle-Round', '1. Start of Battle Round'],
          ['2.-Player-Turns', '2. Player Turns'],
          ['3.-End-of-Battle-Round', '3. End of Battle Round'],
        ],
      },
      {
        id: 'Command-Phase', numero: '08', titolo: 'Command Phase', it: 'Fase di comando',
        sezioni: [
          ['1.-Start-of-Command-Phase', '1. Start of Command Phase'],
          ['2.-Gain-Core-CP', '2. Gain Core CP'],
          ['3.-Battle-shock-Step', '3. Battle-shock Step'],
          ['4.-Command-Abilities', '4. Command Abilities'],
          ['5.-End-of-Command-Phase', '5. End of Command Phase'],
        ],
      },
      {
        id: 'Movement-Phase', numero: '09', titolo: 'Movement Phase', it: 'Fase di movimento',
        sezioni: [
          ['1.-Start-of-Movement-Phase', '1. Start of Movement Phase'],
          ['2.-Move-Units-Step', '2. Move Units Step'],
          ['3.-End-of-Movement-Phase', '3. End of Movement Phase'],
          ['Desperate-Escape-Test', 'Desperate Escape Test'],
          ['Desperate-Escape', 'Desperate Escape'],
          ['Selecting-Modes', 'Selecting Modes'],
        ],
      },
      {
        id: 'Shooting-Phase', numero: '10', titolo: 'Shooting Phase', it: 'Fase di tiro',
        sezioni: [
          ['1.-Start-of-Shooting-Phase', '1. Start of Shooting Phase'],
          ['2.-Shoot', '2. Shoot'],
          ['3.-End-of-Shooting-Phase', '3. End of Shooting Phase'],
        ],
      },
      {
        id: 'Charge-Phase', numero: '11', titolo: 'Charge Phase', it: 'Fase di carica',
        sezioni: [
          ['1.-Start-of-Charge-Phase', '1. Start of Charge Phase'],
          ['2.-Charge-Step', '2. Charge Step'],
          ['3.-End-of-Charge-Phase', '3. End of Charge Phase'],
        ],
      },
      {
        id: 'Fight-Phase', numero: '12', titolo: 'Fight Phase', it: 'Fase di combattimento',
        sezioni: [
          ['1.-Start-of-Fight-Phase', '1. Start of Fight Phase'],
          ['2.-Pile-In', '2. Pile In'],
          ['3.-Fight-Step', '3. Fight Step'],
          ['4.-Consolidate', '4. Consolidate'],
          ['5.-End-of-Fight-Phase', '5. End of Fight Phase'],
        ],
      },
    ],
  },
  {
    titolo: 'Battlefields and Tactics',
    capitoli: [
      {
        id: 'Terrain', numero: '13', titolo: 'Terrain', it: 'Terreno',
        sezioni: [
          ['Placing-Terrain', 'Placing Terrain'],
          ['Terrain-Categories', 'Terrain Categories'],
          ['Exposed', 'Exposed'],
          ['Light', 'Light'],
          ['Dense', 'Dense'],
          ['Terrain-and-Movement', 'Terrain and Movement'],
          ['Terrain-and-Visibility', 'Terrain and Visibility'],
          ['Benefit-of-Cover', 'Benefit of Cover'],
          ['Hidden', 'Hidden'],
          ['Obscuring', 'Obscuring'],
          ['Solid', 'Solid'],
        ],
      },
      {
        id: 'Objectives', numero: '14', titolo: 'Objectives', it: 'Obiettivi',
        sezioni: [
          ['Terrain-Objectives', 'Terrain Objectives'],
          ['Level-of-Control', 'Level of Control'],
          ['Secured-Objectives', 'Secured Objectives'],
        ],
      },
      {
        id: 'Stratagems', numero: '15', titolo: 'Stratagems', it: 'Stratagemmi',
        sezioni: [
          ['Using-Stratagems', 'Using Stratagems'],
          ['Core-Stratagems', 'Core Stratagems'],
        ],
      },
      {
        id: 'Actions', numero: '16', titolo: 'Actions', it: 'Azioni',
        sezioni: [['Performing-Actions', 'Performing Actions']],
      },
    ],
  },
  {
    titolo: 'Advanced Rules',
    capitoli: [
      {
        id: 'Monsters-and-Vehicles', numero: '17', titolo: 'Monsters and Vehicles', it: 'Mostri e veicoli',
        sezioni: [
          ['Moving-Monsters-and-Vehicles', 'Moving Monsters and Vehicles'],
          ['Frame', 'Frame'],
          ['Shooting-at-Engaged-Monsters-and-Vehicles', 'Shooting at Engaged Monsters and Vehicles'],
        ],
      },
      {
        id: 'Transports', numero: '18', titolo: 'Transports', it: 'Trasporti',
        sezioni: [
          ['Transport-Capacity', 'Transport Capacity'],
          ['Embarking', 'Embarking'],
          ['Disembarking', 'Disembarking'],
        ],
      },
      {
        id: 'Attached-Units', numero: '19', titolo: 'Attached Units', it: 'Unità aggregate (leader)',
        sezioni: [
          ['Forming-Attached-Units', 'Forming Attached Units'],
          ['Attacking-Attached-Units', 'Attacking Attached Units'],
          ['Keywords-in-Attached-Units', 'Keywords in Attached Units'],
          ['Abilities-in-Attached-Units', 'Abilities in Attached Units'],
        ],
      },
      {
        id: 'Strategic-Reserves', numero: '20', titolo: 'Strategic Reserves', it: 'Riserve strategiche',
        sezioni: [
          ['Placing-Units-in-Strategic-Reserves', 'Placing Units in Strategic Reserves'],
          ['Strategic-Reserves-at-the-End-of-the-Battle', 'Strategic Reserves at the End of the Battle'],
          ['Repositioned-Units', 'Repositioned Units'],
          ['Arriving-from-Strategic-Reserves', 'Arriving from Strategic Reserves'],
        ],
      },
      {
        id: 'Flying-and-Surging', numero: '21', titolo: 'Flying and Surging', it: 'Volo e balzi',
        sezioni: [
          ['Surge-Moves', 'Surge Moves'],
          ['Flying-Models', 'Flying Models'],
        ],
      },
      {
        id: 'Other-Rules-and-Abilities', numero: '22', titolo: 'Other Rules and Abilities', it: 'Altre regole e abilità',
        sezioni: [
          ['Aura-Abilities', 'Aura Abilities'],
          ['Faction-Abilities', 'Faction Abilities'],
          ['Psychic-Abilities', 'Psychic Abilities'],
          ['Wargear-Abilities', 'Wargear Abilities'],
          ['Plunging-Fire', 'Plunging Fire'],
        ],
      },
      {
        id: 'Aircraft', numero: '23', titolo: 'Aircraft', it: 'Velivoli',
        sezioni: [
          ['Deployment', 'Deployment'],
          ['Movement', 'Movement'],
          ['Shooting', 'Shooting'],
          ['Charging-and-Fighting', 'Charging and Fighting'],
        ],
      },
    ],
  },
  {
    titolo: 'Reference',
    capitoli: [
      {
        id: 'Core-Abilities', numero: '24', titolo: 'Core Abilities', it: 'Abilità base',
        sezioni: [
          ['Abilities', 'Abilities'],
          ['Duplicated-Abilities', 'Duplicated Abilities'],
        ],
      },
      {
        id: 'Muster-Armies', numero: '25', titolo: 'Muster Armies', it: "Composizione dell'armata",
        sezioni: [
          ['Start-Your-Army-Roster', 'Start Your Army Roster'],
          ['Select-Army-Faction', 'Select Army Faction'],
          ['Select-Battle-Size', 'Select Battle Size'],
          ['Fill-Your-Army-Roster', 'Fill Your Army Roster'],
        ],
      },
    ],
  },
];
