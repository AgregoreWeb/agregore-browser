import elf from 'agregore://elves/elf.js'

const $ = elf('goodbye-world', {
  planet: 'World',
  defunctPlanets: []
})

$.draw((target) => {
    const data = $.learn()
    return `<button>Goodbye ${data.planet}!</button>`
  }, {
  afterUpdate: (target) => {
    {
      const data = $.learn()
      if(data.defunctPlanets.includes('pluto')) {
        alert('bring back pluto')
      }
    }
  }
})

$.when('click', 'button', (event) =>  {
  $.teach(
    { planet: 'pluto'},
    (state, payload) => {
      return {
        ...state,
        defunctPlanets: [...new Set([...state.defunctPlanets, payload.planet])]
      }
  })
})
