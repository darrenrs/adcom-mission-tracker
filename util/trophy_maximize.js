// Note: this file is only intended for developers

const advanceResearchersToMaxLevel = () => {
  if (currentMode === 'main') {
    return
  }

  clickChangePropagandaBoost(1)

  const researchers = getData().Researchers
  
  for (let i of researchers) {
    const rarityIndex = i["Rarity"] === 'LteCommon' ? 4 : 5
    const levelDelta = getData()["ResearcherRankCosts"][rarityIndex]["Quantity"].length + 1

    clickLevelResearcher(i["Id"], levelDelta)
  }
}

const getFreeCycleMaxTrophies = (hours) => {
  const rankStructure = getData()["Ranks"]
  const maxRankTrophyCoefficient = rankStructure[rankStructure.length - 1]["GachaMultiplierTrophy"]

  let totalTrophies = getData()["GachaScripts"].find(id => id["GachaId"] === getData()["GachaFreeCycle"][0]["ScriptId"])["Trophy"]
  let effectiveCycle = structuredClone(getData()["GachaFreeCycle"][0]["Cycle"])
  effectiveCycle.push(effectiveCycle[0])  // bug where last capsule is repeated twice

  for (let i = 2; i < hours; i += 2) {
    const cycleIndex = ((i - 2) / 2) % effectiveCycle.length
    const capsuleTrophyCoefficient = getData()["GachaLootTable"].find(id => id["Id"] === effectiveCycle[cycleIndex])["TrophyMin"]

    totalTrophies += capsuleTrophyCoefficient * maxRankTrophyCoefficient
  }

  return totalTrophies
}

const advanceToMaxRankOptimal = () => {
  const maxRank = getData()["Ranks"].length
  
  let totalTrophies = 0

  while (!(parseInt(getEventCurrentRankTitle().split(' ')[0]) === maxRank)) {
    const activeMissionsDOM = document.querySelector('#Current-body').children
    const activeMissionsId = Array.prototype.slice.call(activeMissionsDOM).map((x) => x.children[1].getAttribute('data-mission'))
    const activeMissions = getData()["Missions"].filter(id => activeMissionsId.includes(id["Id"]))

    // check for scripted
    const allScripted = activeMissions.filter(x => x["Reward"]["RewardId"].includes('sc'))

    if (allScripted.length > 0) {
      const requestedScript = getData()["GachaScripts"].find(id => id["GachaId"] === allScripted[0]["Reward"]["RewardId"])
      const scriptTrophies = requestedScript["Trophy"]

      totalTrophies += scriptTrophies

      clickMission(allScripted[0]["Id"])
      continue
    }

    // check for plastic
    const allPlastic = activeMissions.filter(x => x["Reward"]["RewardId"] === 'plastic')

    if (allPlastic.length > 0) { 
      const capsuleTrophyCoefficient = getData()["GachaLootTable"].find(id => id["Id"] === allPlastic[0]["Reward"]["RewardId"])["TrophyMin"]
      const rankTrophyCoefficient = getData()["Ranks"][getEventCurrentRankTitle().split(' ')[0] - 1]["GachaMultiplierTrophy"]

      totalTrophies += capsuleTrophyCoefficient * rankTrophyCoefficient

      clickMission(allPlastic[0]["Id"])
      continue
    }

    // check for armored
    const allArmored = activeMissions.filter(x => x["Reward"]["RewardId"] === 'armored')

    if (allArmored.length > 0) { 
      const capsuleTrophyCoefficient = getData()["GachaLootTable"].find(id => id["Id"] === allArmored[0]["Reward"]["RewardId"])["TrophyMin"]
      const rankTrophyCoefficient = getData()["Ranks"][getEventCurrentRankTitle().split(' ')[0] - 1]["GachaMultiplierTrophy"]

      totalTrophies += capsuleTrophyCoefficient * rankTrophyCoefficient

      clickMission(allArmored[0]["Id"])
    }
  }

  return totalTrophies
}

const advanceToMissionWithinMax = (n) => {
  let totalTrophies = 0

  while (parseInt(getEventCurrentRankTitle().split(' ')[1].split('/')[0].replace('(','')) < n || parseInt(getEventCurrentRankTitle().split(' ')[1].split('/')[0].replace('(','')) === parseInt(getEventCurrentRankTitle().split(' ')[1].split('/')[1].replace(')',''))) {
    const activeMissionsDOM = document.querySelector('#Current-body').children
    const activeMissionsId = Array.prototype.slice.call(activeMissionsDOM).map((x) => x.children[1].getAttribute('data-mission'))
    const activeMissions = getData()["Missions"].filter(id => activeMissionsId.includes(id["Id"]))

    // check for armored
    const allArmored = activeMissions.filter(x => x["Reward"]["RewardId"] === 'armored')

    if (allArmored.length > 0) { 
      const capsuleTrophyCoefficient = getData()["GachaLootTable"].find(id => id["Id"] === allArmored[0]["Reward"]["RewardId"])["TrophyMin"]
      const rankTrophyCoefficient = getData()["Ranks"][getEventCurrentRankTitle().split(' ')[0] - 1]["GachaMultiplierTrophy"]

      totalTrophies += capsuleTrophyCoefficient * rankTrophyCoefficient

      clickMission(allArmored[0]["Id"])
    }

    // check for plastic
    const allPlastic = activeMissions.filter(x => x["Reward"]["RewardId"] === 'plastic')

    if (allPlastic.length > 0) { 
      const capsuleTrophyCoefficient = getData()["GachaLootTable"].find(id => id["Id"] === allPlastic[0]["Reward"]["RewardId"])["TrophyMin"]
      const rankTrophyCoefficient = getData()["Ranks"][getEventCurrentRankTitle().split(' ')[0] - 1]["GachaMultiplierTrophy"]

      totalTrophies += capsuleTrophyCoefficient * rankTrophyCoefficient

      clickMission(allPlastic[0]["Id"])
      continue
    }

    // check for scripted
    const allScripted = activeMissions.filter(x => x["Reward"]["RewardId"].includes('sc'))

    if (allScripted.length > 0) {
      const requestedScript = getData()["GachaScripts"].find(id => id["GachaId"] === allScripted[0]["Reward"]["RewardId"])
      const scriptTrophies = requestedScript["Trophy"]

      totalTrophies += scriptTrophies

      clickMission(allScripted[0]["Id"])
      continue
    }
  }

  return totalTrophies
}

const estimateMaxComOutput = (cps, hours, golden=true) => {
  if (golden) {
    const adDuration = getAirdropValue(getData()["AirDrops"][2], getData()["Ranks"].length)
    const goldenTotalAds = Math.floor((hours / 24) * 50)  // if someone farms for an average of 10 cycles per day, and gets 5 com ads on average, that would be 50 ad-value drops per day

    return cps * hours * 3600 + adDuration * goldenTotalAds * cps
  } else {
    const hoursPerReset = getData()["AirDropsConfig"][0]["AdCountResetInterval"] / 3600
    const totalIntervals = Math.ceil(hours / hoursPerReset)
    const totalAds = getData()["AirDrops"][2]["MaxAdsPerInterval"] * totalIntervals
    const adDuration = getAirdropValue(getData()["AirDrops"][2], getData()["Ranks"].length)

    return cps * hours * 3600 + adDuration * totalAds * cps
  }
}

const trophyAggregate = (hours, maxMission) => {
  advanceResearchersToMaxLevel()

  let totalTrophies = 0

  totalTrophies += getFreeCycleMaxTrophies(hours)
  totalTrophies += advanceToMaxRankOptimal()
  totalTrophies += advanceToMissionWithinMax(maxMission)

  return totalTrophies
}