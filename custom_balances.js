DATA["thanksgiving-bal-10"] = {
    "AirDrops": [
        {
            "Id": 10001,
            "AirDropRewardType": "CoreResource",
            "IsAd": false,
            "IsAdSkippable": false,
            "Weight": 15,
            "MaxAdsPerInterval": - 1,
            "RewardCalculation": {
                "A": 1800,
                "B": 5,
                "C": 0.125,
                "D": 25
            }
        },
        {
            "Id": 10002,
            "AirDropRewardType": "PrimaryCurrency",
            "IsAd": false,
            "IsAdSkippable": false,
            "Weight": 10,
            "MaxAdsPerInterval": -1,
            "RewardCalculation": {
                "A": 450,
                "B": 1.55,
                "C": 0.4,
                "D": 10
            }
        },
        {
            "Id": 10003,
            "AirDropRewardType": "PrimaryCurrency",
            "IsAd": true,
            "IsAdSkippable": false,
            "Weight": 50,
            "MaxAdsPerInterval": 8,
            "RewardCalculation": {
                "A": 7500,
                "B": 1.7,
                "C": 0.2,
                "D": -650
            }
        },
        {
            "Id": 10004,
            "AirDropRewardType": "SoftCurrency",
            "IsAd": true,
            "IsAdSkippable": false,
            "Weight": 25,
            "MaxAdsPerInterval": 5,
            "RewardCalculation": {
                "A": 1125,
                "B": 1.03,
                "C": 1.001,
                "D": 55
            }
        }
    ],
    "AirDropsConfig": [
        {
            "AirDropBaseInterval": 50,
            "AirDropIntervalVariance": 0.1,
            "AirDropIntervalMultiplier": 1.2,
            "ClaimCountResetInterval": 5400,
            "AdCountResetInterval": 43200,
            "StartupDelay": 30,
            "StartCondition": {
                "ConditionType": "RankReached",
                "Threshold": 2
            },
            "HasAdFreeAirDrops": true,
            "ProratedAdFreeAirDropsEnabled": true
        }
    ],
    "GachaFreeCycle": [
        {
            "Cycle": [
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "plastic",
                "armored",
                "plastic"
            ],

        }
    ],
    "GachaScripts": [
        {
            "GachaId": "sc3",
            "MimicGachaId": "plastic",
            "Science": 52,
            "Gold": 0,
            "Trophy": 10,
            "Card": [
                {
                    "Id": "THX001",
                    "Value": 3
                },
                {
                    "Id": "SF0016",
                    "Value": 1
                }
            ]
        }
    ],
    "GachaLootTable": [
        {
            "Id": "plastic",
            "CardWeight": 14,
            "RareWeight": - 1,
            "EpicWeight": -1,
            "SupremeWeight": -1,
            "LteRareWeight": 7,
            "ScienceMin": 55,
            "ScienceMax": 57,
            "TrophyMin": 10,
            "TrophyMax": 10,
            "ChanceMultiplier": 10,
            "WeightDivider": 10,
            "Type": "Normal"
        },
        {
            "Id": "armored",
            "CardWeight": 32,
            "RareWeight": - 1,
            "EpicWeight": -1,
            "SupremeWeight": -1,
            "LteRareWeight": 5,
            "ScienceMin": 165,
            "ScienceMax": 168,
            "TrophyMin": 30,
            "TrophyMax": 30,
            "ChanceMultiplier": 10,
            "WeightDivider": 10,
            "Type": "Normal"
        },
        {
            "Id": "titanium",
            "CardWeight": 200,
            "RareWeight": - 1,
            "EpicWeight": -1,
            "SupremeWeight": -1,
            "LteRareWeight": 5,
            "ScienceMin": 1400,
            "ScienceMax": 1600,
            "TrophyMin": 0,
            "TrophyMax": 0,
            "ChanceMultiplier": 10,
            "WeightDivider": 10,
            "Type": "Premium"
        },
        {
            "Id": "tech",
            "CardWeight": 100,
            "RareWeight": - 1,
            "EpicWeight": -1,
            "SupremeWeight": -1,
            "LteRareWeight": 1,
            "ScienceMin": 0,
            "ScienceMax": 0,
            "TrophyMin": 0,
            "TrophyMax": 0,
            "ChanceMultiplier": 10,
            "WeightDivider": 10,
            "Type": "Fixed"
        },
        {
            "Id": "sc3",
            "Type": "Scripted"
        },
        {
            "Id": "sc_m01",
            "Type": "Scripted"
        }
    ],
    "Generators": [
        {
            "Id": "comradegenerator",
            "Name": "Comrade",
            "ResourceType": "comradegenerator",
            "GeneratorType": "Automatic",
            "Generate": {
                "Resource": "comrade",
                "Qty": 1
            },
            "BaseCompletionTime": 1,
            "IncludeInAll": false,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            }
        },
        {
            "Id": "potatomasher",
            "Name": "PotatoMasher",
            "ResourceType": "potatomasher",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "Mashpotato",
                    "Qty": 10
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "Mashpotato",
                "Qty": 5
            },
            "BaseCompletionTime": 2,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "Mashpotato",
                    "Threshold": 0
                }
            ],
            "Unlock": {
                "ConditionType": "IndustryUnlocked",
                "ConditionId": "foodlabour",
                "Threshold": 0
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 2
            }
        },
        {
            "Id": "chef",
            "Name": "Chefs",
            "ResourceType": "chef",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "potatomasher",
                    "Qty": 10
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+6
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "potatomasher",
                "Qty": 10
            },
            "BaseCompletionTime": 6,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "potatomasher",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "potatomasher",
                "Threshold": 250
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 4
            }
        },
        {
            "Id": "kitchen",
            "Name": "Kitchens",
            "ResourceType": "kitchen",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "chef",
                    "Qty": 1000
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+12
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "chef",
                "Qty": 15
            },
            "BaseCompletionTime": 18,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "chef",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "chef",
                "Threshold": 50000
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 6
            }
        },
        {
            "Id": "tatertruck",
            "Name": "Tatertrucks",
            "ResourceType": "tatertruck",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "kitchen",
                    "Qty": 1000
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+23
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "kitchen",
                "Qty": 20
            },
            "BaseCompletionTime": 54,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "kitchen",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "kitchen",
                "Threshold": 1e+6
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 8
            }
        },
        {
            "Id": "silosmasher",
            "Name": "Silosmashers",
            "ResourceType": "silosmasher",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "tatertruck",
                    "Qty": 1e+5
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+43
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "tatertruck",
                "Qty": 25
            },
            "BaseCompletionTime": 162,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "tatertruck",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "tatertruck",
                "Threshold": 2.5e+7
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 10
            }
        },
        {
            "Id": "gravyfeds",
            "Name": "Gravyfeds",
            "ResourceType": "gravyfeds",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "silosmasher",
                    "Qty": 1e+6
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+72
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "silosmasher",
                "Qty": 30
            },
            "BaseCompletionTime": 486,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "silosmasher",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "silosmasher",
                "Threshold": 2e+8
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 12
            }
        },
        {
            "Id": "feastfoundry",
            "Name": "Feastfoundries",
            "ResourceType": "feastfoundry",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "gravyfeds",
                    "Qty": 1e+9
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+101
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "gravyfeds",
                "Qty": 35
            },
            "BaseCompletionTime": 1458,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "gravyfeds",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "gravyfeds",
                "Threshold": 2.5e+10
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 14
            }
        },
        {
            "Id": "carbcollective",
            "Name": "Carbcollectives",
            "ResourceType": "carbcollective",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "feastfoundry",
                    "Qty": 1e+10
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+145
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "feastfoundry",
                "Qty": 40
            },
            "BaseCompletionTime": 4374,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "feastfoundry",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "feastfoundry",
                "Threshold": 2.5e+11
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 16
            }
        },
        {
            "Id": "mashmonument",
            "Name": "Mashmonuments",
            "ResourceType": "mashmonument",
            "GeneratorType": "Manual",
            "IndustryId": "foodlabour",
            "Cost": [
                {
                    "Resource": "carbcollective",
                    "Qty": 1e+11
                },
                {
                    "Resource": "Mashpotato",
                    "Qty": 1e+175
                },
                {
                    "Resource": "Comrade",
                    "Qty": 1
                }
            ],
            "Generate": {
                "Resource": "carbcollective",
                "Qty": 45
            },
            "BaseCompletionTime": 13122,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "carbcollective",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "carbcollective",
                "Threshold": 2.5e+12
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 18
            }
        },
        {
            "Id": "backyardturkey",
            "Name": "Backyardturkeys",
            "ResourceType": "backyardturkey",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "Turkeyleg",
                    "Qty": 25
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "Turkeyleg",
                "Qty": 10
            },
            "BaseCompletionTime": 3,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "Mashpotato",
                    "Threshold": 1e+11
                }
            ],
            "Unlock": {
                "ConditionType": "IndustryUnlocked",
                "ConditionId": "animallabour",
                "Threshold": 0
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 4
            }
        },
        {
            "Id": "gobbleguru",
            "Name": "Gobblegurus",
            "ResourceType": "gobbleguru",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "backyardturkey",
                    "Qty": 1000
                },
                {
                    "Resource": "Turkeyleg",
                    "Qty": 1e+10
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "backyardturkey",
                "Qty": 20
            },
            "BaseCompletionTime": 12,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "backyardturkey",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "backyardturkey",
                "Threshold": 25000
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 8
            }
        },
        {
            "Id": "drumstickfarm",
            "Name": "Drumstickfarms",
            "ResourceType": "drumstickfarm",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "gobbleguru",
                    "Qty": 100000
                },
                {
                    "Resource": "Turkeyleg",
                    "Qty": 1e+23
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "gobbleguru",
                "Qty": 30
            },
            "BaseCompletionTime": 48,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "gobbleguru",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "gobbleguru",
                "Threshold": 7.5e+6
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 12
            }
        },
        {
            "Id": "feastfactory",
            "Name": "Feastfactories",
            "ResourceType": "feastfactory",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "drumstickfarm",
                    "Qty": 1e+6
                },
                {
                    "Resource": "Turkeyleg",
                    "Qty": 5e+44
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "drumstickfarm",
                "Qty": 40
            },
            "BaseCompletionTime": 192,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "drumstickfarm",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "drumstickfarm",
                "Threshold": 6.25e+8
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 16
            }
        },
        {
            "Id": "turkeylegtycoon",
            "Name": "Turkeylegtycoons",
            "ResourceType": "turkeylegtycoon",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "feastfactory",
                    "Qty": 1e+7
                },
                {
                    "Resource": "Turkeyleg",
                    "Qty": 5e+66
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "feastfactory",
                "Qty": 50
            },
            "BaseCompletionTime": 768,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "feastfactory",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "feastfactory",
                "Threshold": 3e+8
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 20
            }
        },
        {
            "Id": "gravyreactor",
            "Name": "Gravyreactors",
            "ResourceType": "gravyreactor",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "turkeylegtycoon",
                    "Qty": 1e+9
                },
                {
                    "Resource": "Turkeyleg",
                    "Qty": 1e+92
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "turkeylegtycoon",
                "Qty": 60
            },
            "BaseCompletionTime": 3072,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "turkeylegtycoon",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "turkeylegtycoon",
                "Threshold": 3e+10
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 24
            }
        },
        {
            "Id": "pilgrimpoultrysyndicate",
            "Name": "Pilgrimpoultrysyndicates",
            "ResourceType": "pilgrimpoultrysyndicate",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "gravyreactor",
                    "Qty": 1e+6
                },
                {
                    "Resource": "Turkeyleg",
                    "Qty": 1e+112
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "gravyreactor",
                "Qty": 70
            },
            "BaseCompletionTime": 12288,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "gravyreactor",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "gravyreactor",
                "Threshold": 2.5e+11
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 28
            }
        },
        {
            "Id": "thegreatgobbler",
            "Name": "Thegreatgobblers",
            "ResourceType": "thegreatgobbler",
            "GeneratorType": "Manual",
            "IndustryId": "animallabour",
            "Cost": [
                {
                    "Resource": "pilgrimpoultrysyndicate",
                    "Qty": 1e+11
                },
                {
                    "Resource": "Turkeyleg",
                    "Qty": 1e+164
                },
                {
                    "Resource": "Comrade",
                    "Qty": 3
                }
            ],
            "Generate": {
                "Resource": "pilgrimpoultrysyndicate",
                "Qty": 80
            },
            "BaseCompletionTime": 49152,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "pilgrimpoultrysyndicate",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "pilgrimpoultrysyndicate",
                "Threshold": 2e+12
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 32
            }
        },
        {
            "Id": "toasteroven",
            "Name": "Toasterovens",
            "ResourceType": "toasteroven",
            "GeneratorType": "Manual",
            "IndustryId": "technician",
            "Cost": [
                {
                    "Resource": "fire",
                    "Qty": 100
                },
                {
                    "Resource": "Comrade",
                    "Qty": 5
                }
            ],
            "Generate": {
                "Resource": "fire",
                "Qty": 15
            },
            "BaseCompletionTime": 4,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "Turkeyleg",
                    "Threshold": 1e+14
                }
            ],
            "Unlock": {
                "ConditionType": "IndustryUnlocked",
                "ConditionId": "technician",
                "Threshold": 0
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 6
            }
        },
        {
            "Id": "familyoven",
            "Name": "Familyovens",
            "ResourceType": "familyoven",
            "GeneratorType": "Manual",
            "IndustryId": "technician",
            "Cost": [
                {
                    "Resource": "toasteroven",
                    "Qty": 250000
                },
                {
                    "Resource": "fire",
                    "Qty": 2.5e+13
                },
                {
                    "Resource": "Comrade",
                    "Qty": 5
                }
            ],
            "Generate": {
                "Resource": "toasteroven",
                "Qty": 30
            },
            "BaseCompletionTime": 20,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "toasteroven",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "toasteroven",
                "Threshold": 5e+6
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 12
            }
        },
        {
            "Id": "commercialroaster",
            "Name": "Commercialroasters",
            "ResourceType": "commercialroaster",
            "GeneratorType": "Manual",
            "IndustryId": "technician",
            "Cost": [
                {
                    "Resource": "familyoven",
                    "Qty": 1e+6
                },
                {
                    "Resource": "fire",
                    "Qty": 1e+27
                },
                {
                    "Resource": "Comrade",
                    "Qty": 5
                }
            ],
            "Generate": {
                "Resource": "familyoven",
                "Qty": 45
            },
            "BaseCompletionTime": 100,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "familyoven",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "familyoven",
                "Threshold": 5e+7
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 18
            }
        },
        {
            "Id": "conveyorbeltbakeline",
            "Name": "Conveyorbeltbakelines",
            "ResourceType": "conveyorbeltbakeline",
            "GeneratorType": "Manual",
            "IndustryId": "technician",
            "Cost": [
                {
                    "Resource": "commercialroaster",
                    "Qty": 1e+7
                },
                {
                    "Resource": "fire",
                    "Qty": 1e+58
                },
                {
                    "Resource": "Comrade",
                    "Qty": 5
                }
            ],
            "Generate": {
                "Resource": "commercialroaster",
                "Qty": 60
            },
            "BaseCompletionTime": 500,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "commercialroaster",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "commercialroaster",
                "Threshold": 3e+8
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 24
            }
        },
        {
            "Id": "smartaioven",
            "Name": "Smartaiovens",
            "ResourceType": "smartaioven",
            "GeneratorType": "Manual",
            "IndustryId": "technician",
            "Cost": [
                {
                    "Resource": "conveyorbeltbakeline",
                    "Qty": 1e+9
                },
                {
                    "Resource": "fire",
                    "Qty": 1e+82
                },
                {
                    "Resource": "Comrade",
                    "Qty": 5
                }
            ],
            "Generate": {
                "Resource": "conveyorbeltbakeline",
                "Qty": 75
            },
            "BaseCompletionTime": 2500,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "conveyorbeltbakeline",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "conveyorbeltbakeline",
                "Threshold": 2.5e+10
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 30
            }
        },
        {
            "Id": "volcanicbakingchamber",
            "Name": "Volcanicbakingchambers",
            "ResourceType": "volcanicbakingchamber",
            "GeneratorType": "Manual",
            "IndustryId": "technician",
            "Cost": [
                {
                    "Resource": "smartaioven",
                    "Qty": 1e+10
                },
                {
                    "Resource": "fire",
                    "Qty": 1e+117
                },
                {
                    "Resource": "Comrade",
                    "Qty": 5
                }
            ],
            "Generate": {
                "Resource": "smartaioven",
                "Qty": 90
            },
            "BaseCompletionTime": 12500,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "smartaioven",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "smartaioven",
                "Threshold": 2e+11
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 36
            }
        },
        {
            "Id": "theeternalovn",
            "Name": "Theeternaloven",
            "ResourceType": "theeternalovn",
            "GeneratorType": "Manual",
            "IndustryId": "technician",
            "Cost": [
                {
                    "Resource": "volcanicbakingchamber",
                    "Qty": 1e+11
                },
                {
                    "Resource": "fire",
                    "Qty": 1e+157
                },
                {
                    "Resource": "Comrade",
                    "Qty": 5
                }
            ],
            "Generate": {
                "Resource": "volcanicbakingchamber",
                "Qty": 105
            },
            "BaseCompletionTime": 62500,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "volcanicbakingchamber",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "volcanicbakingchamber",
                "Threshold": 2e+12
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 42
            }
        },
        {
            "Id": "crustkneader",
            "Name": "Crustkneaders",
            "ResourceType": "crustkneader",
            "GeneratorType": "Manual",
            "IndustryId": "baker",
            "Cost": [
                {
                    "Resource": "Pie",
                    "Qty": 10000
                },
                {
                    "Resource": "Comrade",
                    "Qty": 7
                }
            ],
            "Generate": {
                "Resource": "Pie",
                "Qty": 20
            },
            "BaseCompletionTime": 5,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "fire",
                    "Threshold": 1e+33
                }
            ],
            "Unlock": {
                "ConditionType": "IndustryUnlocked",
                "ConditionId": "baker",
                "Threshold": 0
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 8
            }
        },
        {
            "Id": "fillingwhipper",
            "Name": "Fillingwhippers",
            "ResourceType": "fillingwhipper",
            "GeneratorType": "Manual",
            "IndustryId": "baker",
            "Cost": [
                {
                    "Resource": "crustkneader",
                    "Qty": 1e+8
                },
                {
                    "Resource": "Pie",
                    "Qty": 1e+19
                },
                {
                    "Resource": "Comrade",
                    "Qty": 7
                }
            ],
            "Generate": {
                "Resource": "crustkneader",
                "Qty": 40
            },
            "BaseCompletionTime": 30,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "crustkneader",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "crustkneader",
                "Threshold": 7.5e+8
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 16
            }
        },
        {
            "Id": "pieassemblyline",
            "Name": "Pieassemblylines",
            "ResourceType": "pieassemblyline",
            "GeneratorType": "Manual",
            "IndustryId": "baker",
            "Cost": [
                {
                    "Resource": "fillingwhipper",
                    "Qty": 1e+9
                },
                {
                    "Resource": "Pie",
                    "Qty": 1e+40
                },
                {
                    "Resource": "Comrade",
                    "Qty": 7
                }
            ],
            "Generate": {
                "Resource": "fillingwhipper",
                "Qty": 60
            },
            "BaseCompletionTime": 180,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "fillingwhipper",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "fillingwhipper",
                "Threshold": 7.5e+9
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 24
            }
        },
        {
            "Id": "pieempireexecutive",
            "Name": "Pieempireexecutives",
            "ResourceType": "pieempireexecutive",
            "GeneratorType": "Manual",
            "IndustryId": "baker",
            "Cost": [
                {
                    "Resource": "pieassemblyline",
                    "Qty": 1e+10
                },
                {
                    "Resource": "Pie",
                    "Qty": 1e+68
                },
                {
                    "Resource": "Comrade",
                    "Qty": 7
                }
            ],
            "Generate": {
                "Resource": "pieassemblyline",
                "Qty": 80
            },
            "BaseCompletionTime": 1080,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "pieassemblyline",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "pieassembly",
                "Threshold": 5e+10
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 32
            }
        },
        {
            "Id": "sweetfusionlab",
            "Name": "Sweetfusionlabs",
            "ResourceType": "sweetfusionlab",
            "GeneratorType": "Manual",
            "IndustryId": "baker",
            "Cost": [
                {
                    "Resource": "pieempireexecutive",
                    "Qty": 3e+10
                },
                {
                    "Resource": "Pie",
                    "Qty": 1e+99
                },
                {
                    "Resource": "Comrade",
                    "Qty": 7
                }
            ],
            "Generate": {
                "Resource": "pieempireexecutive",
                "Qty": 100
            },
            "BaseCompletionTime": 6480,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "pieempireexecutive",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "pieempireexecutive",
                "Threshold": 3e+11
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 40
            }
        },
        {
            "Id": "thegreatbaker",
            "Name": "Thegreatbakers",
            "ResourceType": "thegreatbaker",
            "GeneratorType": "Manual",
            "IndustryId": "baker",
            "Cost": [
                {
                    "Resource": "sweetfusionlab",
                    "Qty": 2.5e+11
                },
                {
                    "Resource": "Pie",
                    "Qty": 1e+135
                },
                {
                    "Resource": "Comrade",
                    "Qty": 7
                }
            ],
            "Generate": {
                "Resource": "sweetfusionlab",
                "Qty": 120
            },
            "BaseCompletionTime": 38880,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "sweetfusionlab",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "sweetfusionlab",
                "Threshold": 2e+12
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 48
            }
        },
        {
            "Id": "dumpsterhorn",
            "Name": "Dumpsterhorns",
            "ResourceType": "dumpsterhorn",
            "GeneratorType": "Manual",
            "IndustryId": "botanist",
            "Cost": [
                {
                    "Resource": "Cornucopia",
                    "Qty": 1e+9
                },
                {
                    "Resource": "Comrade",
                    "Qty": 9
                }
            ],
            "Generate": {
                "Resource": "Cornucopia",
                "Qty": 25
            },
            "BaseCompletionTime": 6,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "Pie",
                    "Threshold": 1e+60
                }
            ],
            "Unlock": {
                "ConditionType": "IndustryUnlocked",
                "ConditionId": "botanist",
                "Threshold": 0
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 10
            }
        },
        {
            "Id": "craftfairsupply",
            "Name": "Craftfairsupplies",
            "ResourceType": "craftfairsupply",
            "GeneratorType": "Manual",
            "IndustryId": "botanist",
            "Cost": [
                {
                    "Resource": "dumpsterhorn",
                    "Qty": 1e+8
                },
                {
                    "Resource": "Cornucopia",
                    "Qty": 1e+28
                },
                {
                    "Resource": "Comrade",
                    "Qty": 9
                }
            ],
            "Generate": {
                "Resource": "dumpsterhorn",
                "Qty": 50
            },
            "BaseCompletionTime": 42,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "dumpsterhorn",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "dumpsterhorn",
                "Threshold": 1e+10
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 20
            }
        },
        {
            "Id": "harvesthornsmith",
            "Name": "Harvesthornsmiths",
            "ResourceType": "harvesthornsmith",
            "GeneratorType": "Manual",
            "IndustryId": "botanist",
            "Cost": [
                {
                    "Resource": "craftfairsupply",
                    "Qty": 1e+9
                },
                {
                    "Resource": "Cornucopia",
                    "Qty": 1e+56
                },
                {
                    "Resource": "Comrade",
                    "Qty": 9
                }
            ],
            "Generate": {
                "Resource": "craftfairsupply",
                "Qty": 75
            },
            "BaseCompletionTime": 294,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "craftfairsupply",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "craftfairsupply",
                "Threshold": 5e+10
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 30
            }
        },
        {
            "Id": "gildedgourd",
            "Name": "Gildedgourdsconsortium",
            "ResourceType": "gildedgourd",
            "GeneratorType": "Manual",
            "IndustryId": "botanist",
            "Cost": [
                {
                    "Resource": "harvesthornsmith",
                    "Qty": 1e+10
                },
                {
                    "Resource": "Cornucopia",
                    "Qty": 1e+84
                },
                {
                    "Resource": "Comrade",
                    "Qty": 9
                }
            ],
            "Generate": {
                "Resource": "harvesthornsmith",
                "Qty": 100
            },
            "BaseCompletionTime": 2058,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "harvesthornsmith",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "harvesthornsmith",
                "Threshold": 3e+11
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 40
            }
        },
        {
            "Id": "theinfinitehorn",
            "Name": "Theinfinitehorn",
            "ResourceType": "theinfinitehorn",
            "GeneratorType": "Manual",
            "IndustryId": "botanist",
            "Cost": [
                {
                    "Resource": "gildedgourd",
                    "Qty": 1e+11
                },
                {
                    "Resource": "Cornucopia",
                    "Qty": 1e+121
                },
                {
                    "Resource": "Comrade",
                    "Qty": 9
                }
            ],
            "Generate": {
                "Resource": "gildedgourd",
                "Qty": 125
            },
            "BaseCompletionTime": 14406,
            "Visible": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "gildedgourd",
                    "Threshold": 2
                }
            ],
            "Unlock": {
                "ConditionType": "ResourceQuantity",
                "ConditionId": "gildedgourd",
                "Threshold": 3e+11
            },
            "IncludeInAll": true,
            "Crit": {
                "ChancePercent": 0,
                "Multiplier": 1
            },
            "ObjectiveReward": {
                "Reward": "Resources",
                "RewardId": "darkscience",
                "Value": 50
            }
        },
    ],
    "CardStoreCost": [
        {
            "Rarity": "Common",
            "ScienceCost": 0,
            "GoldCost": 0,
            "AdWatchStackModifier": 0
        },
        {
            "Rarity": "Rare",
            "ScienceCost": 0,
            "GoldCost": 0,
            "AdWatchStackModifier": 0
        },
        {
            "Rarity": "Epic",
            "ScienceCost": 0,
            "GoldCost": 0,
            "AdWatchStackModifier": 0
        },
        {
            "Rarity": "Supreme",
            "ScienceCost": 0,
            "GoldCost": 0,
            "AdWatchStackModifier": 0
        },
        {
            "Rarity": "LteCommon",
            "ScienceCost": 30,
            "GoldCost": 2,
            "AdWatchStackModifier": 0.25
        },
        {
            "Rarity": "LteRare",
            "ScienceCost": 250,
            "GoldCost": 15,
            "AdWatchStackModifier": 0.1
        }
    ],
    "CardStoreStackSize": [
        {
            "Rank": 1,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 10,
            "LteRare": 2
        },
        {
            "Rank": 2,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 10,
            "LteRare": 2
        },
        {
            "Rank": 3,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 10,
            "LteRare": 2
        },
        {
            "Rank": 4,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 20,
            "LteRare": 3
        },
        {
            "Rank": 5,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 20,
            "LteRare": 3
        },
        {
            "Rank": 6,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 20,
            "LteRare": 3
        },
        {
            "Rank": 7,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 20,
            "LteRare": 3
        },
        {
            "Rank": 8,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 30,
            "LteRare": 4
        },
        {
            "Rank": 9,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 30,
            "LteRare": 4
        },
        {
            "Rank": 10,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 30,
            "LteRare": 4
        },
        {
            "Rank": 11,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 30,
            "LteRare": 4
        },
        {
            "Rank": 12,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 30,
            "LteRare": 4
        },
        {
            "Rank": 13,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 40,
            "LteRare": 5
        },
        {
            "Rank": 14,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 40,
            "LteRare": 5
        },
        {
            "Rank": 15,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 40,
            "LteRare": 5
        },
        {
            "Rank": 16,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 40,
            "LteRare": 5
        },
        {
            "Rank": 17,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 40,
            "LteRare": 5
        },
        {
            "Rank": 18,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 40,
            "LteRare": 5
        },
        {
            "Rank": 19,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 50,
            "LteRare": 6
        },
        {
            "Rank": 20,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 50,
            "LteRare": 6
        },
        {
            "Rank": 21,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 50,
            "LteRare": 6
        },
        {
            "Rank": 22,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 50,
            "LteRare": 6
        },
        {
            "Rank": 23,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 50,
            "LteRare": 6
        },
        {
            "Rank": 24,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 50,
            "LteRare": 6
        },
        {
            "Rank": 25,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 50,
            "LteRare": 6
        },
        {
            "Rank": 26,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 27,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 28,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 29,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 30,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 31,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 32,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 33,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 60,
            "LteRare": 7
        },
        {
            "Rank": 34,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 70,
            "LteRare": 8
        },
        {
            "Rank": 35,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 70,
            "LteRare": 8
        },
        {
            "Rank": 36,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 70,
            "LteRare": 8
        },
        {
            "Rank": 37,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 70,
            "LteRare": 8
        },
        {
            "Rank": 38,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 70,
            "LteRare": 8
        },
        {
            "Rank": 39,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 70,
            "LteRare": 8
        },
        {
            "Rank": 40,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 70,
            "LteRare": 8
        },
        {
            "Rank": 41,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 80,
            "LteRare": 9
        },
        {
            "Rank": 42,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 80,
            "LteRare": 9
        },
        {
            "Rank": 43,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 80,
            "LteRare": 9
        },
        {
            "Rank": 44,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 80,
            "LteRare": 9
        },
        {
            "Rank": 45,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 80,
            "LteRare": 9
        },
        {
            "Rank": 46,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 90,
            "LteRare": 10
        },
        {
            "Rank": 47,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 90,
            "LteRare": 10
        },
        {
            "Rank": 48,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 90,
            "LteRare": 10
        },
        {
            "Rank": 49,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 90,
            "LteRare": 10
        },
        {
            "Rank": 50,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 90,
            "LteRare": 10
        },
        {
            "Rank": 51,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 100,
            "LteRare": 11
        },
    ],
    "CardToScienceConversion": {
        "Common": 0,
        "Rare": 0,
        "Epic": 0,
        "Supreme": 0,
        "LteCommon": 15,
        "LteRare": 125
    },
    "CrossPromoTitles": [
        {
            "Id": "adcap",
            "IconId": "icon-crosspromo-adcap",
            "TitleSpriteId": "art-crosspromo-adcap-header",
            "BackgroundSpriteId": "art-crosspromo-adcap-header",
            "LinkedAppId_IOS": "927006017",
            "LinkedAppId_Android": "com.kongregate.mobile.adventurecapitalist.google"
        },
        {
            "Id": "adages",
            "IconId": "icon-crosspromo-adages",
            "TitleSpriteId": "art-crosspromo-adages-header",
            "BackgroundSpriteId": "art-crosspromo-adages-background",
            "LinkedAppId_IOS": "1510649539",
            "LinkedAppId_Android": "ca.hyperhippo.adventureages"
        }
    ],
    "DailyDealSlotChance": [
        {
            "Slot": 1,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 0.8,
            "LteRare": 0.2,
            "GoldCostChance": 0,
            "AdWatchChance": 1,
            "RollAttempt": 1,
            "GoldCost": 20,
            "MaxRoll": 3
        },
        {
            "Slot": 2,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 0.8,
            "LteRare": 0.2,
            "GoldCostChance": 0,
            "AdWatchChance": 1,
            "RollAttempt": 2,
            "GoldCost": 50
        },
        {
            "Slot": 3,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 0.8,
            "LteRare": 0.2,
            "GoldCostChance": 0,
            "AdWatchChance": 1,
            "RollAttempt": 3,
            "GoldCost": 100
        },
        {
            "Slot": 4,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 0.5,
            "LteRare": 0.5,
            "GoldCostChance": 0,
            "AdWatchChance": 0
        },
        {
            "Slot": 5,
            "Common": 0,
            "Rare": 0,
            "Epic": 0,
            "Supreme": 0,
            "LteCommon": 0,
            "LteRare": 1,
            "GoldCostChance": 1,
            "AdWatchChance": 0
        }
    ],
    "FreeGachaData": {
        "TimeBetweenGachas": 7200,
        "MaxStackCount": 2

    },
    "GachaFreeCycle": [
        {
            "Cycle": [
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "armored",
                "plastic",
                "plastic",
                "armored",
            ],
            "ScriptId": "sc3"
        }
    ],
    "GachaGoldCycle": [
        {
            "Cycle": {
                "plastic": [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                "armored": [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            }
        }
    ],
    "GachaStackSplit": [
        {
            "Split": 2,
            "LteCommon": 8,
            "LteRare": 4
        },
        {
            "Split": 3,
            "LteCommon": 25,
            "LteRare": 25
        },
        {
            "Split": 4,
            "LteRare": 75
        }
    ],
    "GeneratorObjectiveLimits": [
        {
            "GeneratorId": "potatomasher",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "chef",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "kitchen",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "tatertruck",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "silosmasher",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "gravyfeds",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "feastfoundry",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "carbcollective",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "mashmonument",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "backyardturkey",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "gobbleguru",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "drumstickfarm",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "feastfactory",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "turkeylegtycoon",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "gravyreactor",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "pilgrimpoultrysyndicate",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "thegreatgobbler",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "toasteroven",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "familyoven",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "commercialroaster",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "conveyorbeltbakeline",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "smartaioven",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "volcanicbakingchamber",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "theeternalovn",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "crustkneader",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "fillingwhipper",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "pieassemblyline",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "pieempireexecutive",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "sweetfusionlab",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "thegreatbaker",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "dumpsterhorn",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "craftfairsupply",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "harvesthornsmith",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "gildedgourd",
            "MaximumObjectivesForRank": [
                999
            ]
        },
        {
            "GeneratorId": "theinfinitehorn",
            "MaximumObjectivesForRank": [
                999
            ]
        }
    ],
    "Industries": [
        {
            "Id": "foodlabour",
            "SortingOrder": 1,
            "VisibleConditions": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "mashpotato"
                }
            ],
            "InteractableConditions": [
                {
                    "ConditionType": "ResourceQuantity",
                    "ConditionId": "mashpotato",
                    "Threshold": 0
                }
            ]
        },
        {
            "Id": "animallabour",
            "SortingOrder": 2,
            "UnlockCostResourceId": "mashpotato",
            "UnlockCostResourceQty": 1e+11,
            "VisibleConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "foodlabour"
                }
            ],
            "InteractableConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "mashpotato",
                    "Threshold": 0
                }
            ]
        },
        {
            "Id": "technician",
            "SortingOrder": 3,
            "UnlockCostResourceId": "turkeyleg",
            "UnlockCostResourceQty": 1e+14,
            "VisibleConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "foodlabour"
                }
            ],
            "InteractableConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "turkeyleg",
                    "Threshold": 0
                }
            ]
        },
        {
            "Id": "baker",
            "SortingOrder": 4,
            "UnlockCostResourceId": "fire",
            "UnlockCostResourceQty": 1e+33,
            "VisibleConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "animallabour"
                }
            ],
            "InteractableConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "fire",
                    "Threshold": 0
                }
            ]
        },
        {
            "Id": "botanist",
            "SortingOrder": 5,
            "UnlockCostResourceId": "pie",
            "UnlockCostResourceQty": 1e+60,
            "VisibleConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "technician"
                }
            ],
            "InteractableConditions": [
                {
                    "ConditionType": "IndustryUnlocked",
                    "ConditionId": "pie",
                    "Threshold": 0
                }
            ]
        }
    ],
    "MiscBalance": {
        "SoftCurrencyId": "darkscience",
        "PrimaryGeneratorId": "comradegenerator",
        "PrimaryResourceId": "comrade",
        "HardToSoftCurrencyConversionRatio": 20,
        "OfferwallPlatforms": "android",
        "TotalSpendIncludesLte": false,
        "DaysForRecentSpend": 26,
        "RanksToTriggerOffers": "4,7,10,13,16,20",
        "ComradeSpendWarningEnableRank": 3,
        "ReferralReward": 110,
        "WelcomeBackBonusComrades": 0.3,
        "EmailFeatureEnabled": true,
        "EnableNewBucketing": false
    },
    "Missions": [
        {
            "Id": "M001",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 50000,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1
            }
        },
        {
            "Id": "M002",
            "Rank": 1,
            "Condition": {
                "ConditionType": "TradesSinceSubscription",
                "Threshold": 4,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M003",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 20,
                "ConditionId": "potatomasher"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M004",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 15,
                "ConditionId": "chef"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M005",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResearchersUpgradedSinceSubscription",
                "Threshold": 2,
                "ConditionId": "any"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M006",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 200,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M007",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 1500,
                "ConditionId": "chef"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M008",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 1.e+9,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M009",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesSpentSinceSubscription",
                "Threshold": 200,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M010",
            "Rank": 1,
            "Condition": {
                "ConditionType": "IndustryUnlocked",
                "Threshold": 1,
                "ConditionId": "animallabour"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M011",
            "Rank": 1,
            "Condition": {
                "ConditionType": "TradesSinceSubscription",
                "Threshold": 3,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1
            }
        },
        {
            "Id": "M012",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 300,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1
            }
        },
        {
            "Id": "M014",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResearchersUpgradedSinceSubscription",
                "Threshold": 2,
                "ConditionId": "any"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M015",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 15,
                "ConditionId": "kitchen"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M016",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 500,
                "ConditionId": "backyardturkey"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M017",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 300,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M018",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 750000,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M019",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesSpentSinceSubscription",
                "Threshold": 300,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M020",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 5000,
                "ConditionId": "kitchen"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M021",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 2.5e+15,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M022",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 24680,
                "ConditionId": "backyardturkey"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M023",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 2.5e+8,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M024",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 3,
                "ConditionId": "gobbleguru"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M025",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResearchersUpgradedSinceSubscription",
                "Threshold": 3,
                "ConditionId": "any"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M026",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 7.7e+18,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M027",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 333444,
                "ConditionId": "kitchen"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M028",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 600,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M029",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesSpentSinceSubscription",
                "Threshold": 550,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M030",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 1.5e+11,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M031",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 898989,
                "ConditionId": "kitchen"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M032",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 1e+21,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M033",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResearchersUpgradedSinceSubscription",
                "Threshold": 2,
                "ConditionId": "any"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M034",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 2,
                "ConditionId": "tatertruck"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M035",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 16000,
                "ConditionId": "gobbleguru"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M036",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 350,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M037",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 3.45e+12,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M038",
            "Rank": 1,
            "Condition": {
                "ConditionType": "IndustryUnlocked",
                "Threshold": 1,
                "ConditionId": "technician"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }
        },
        {
            "Id": "M039",
            "Rank": 1,
            "Condition": {
                "ConditionType": "TradesSinceSubscription",
                "Threshold": 5,
                "ConditionId": "fire"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }
        },
        {
            "Id": "M040",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 2.5e+6,
                "ConditionId": "fire"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M041",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 7200,
                "ConditionId": "toasteroven"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M042",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 100000,
                "ConditionId": "tatertruck"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M043",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResearchersUpgradedSinceSubscription",
                "Threshold": 4,
                "ConditionId": "any"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }

        },
        {
            "Id": "M044",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 400,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }

        },
        {
            "Id": "M045",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 999999,
                "ConditionId": "gobbleguru"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M046",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 1223344,
                "ConditionId": "tatertruck"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M047",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesSpentSinceSubscription",
                "Threshold": 700,
                "ConditionId": "darkscience"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "armored",
                "Value": 1

            }

        },
        {
            "Id": "M048",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 8.5e+8,
                "ConditionId": "fire"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M049",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 7.5e+21,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M050",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 7.5e+6,
                "ConditionId": "gobbleguru"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M051",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 1.56e+41,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M052",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 8,
                "ConditionId": "drumstickfarm"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M053",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 6.78e+29,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M054",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 1.47e+7,
                "ConditionId": "tatertruck"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M055",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 2.6e+42,
                "ConditionId": "mashpotato"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M056",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 2,
                "ConditionId": "silosmasher"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M057",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 1.456e+11,
                "ConditionId": "fire"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M058",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 2829,
                "ConditionId": "drumstickfarm"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M059",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 3.3e+6,
                "ConditionId": "toasteroven"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M060",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourcesEarnedSinceSubscription",
                "Threshold": 5.9e+34,
                "ConditionId": "turkeyleg"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
        {
            "Id": "M061",
            "Rank": 1,
            "Condition": {
                "ConditionType": "ResourceQuantity",
                "Threshold": 4,
                "ConditionId": "familyoven"
            },
            "Reward": {
                "Reward": "Gacha",
                "RewardId": "plastic",
                "Value": 1

            }

        },
    ],
    "Ranks": [
        {
            "Rank": "1",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "5",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 0.25,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 0.9,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 1,
            "AirDropScience": 35,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "2",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "4",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 0.375,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 2,
            "AirDropScience": 40,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "3",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "5",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 0.5,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1.1,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 3,
            "AirDropScience": 45,
            "AirDropRankUpCoolDown": 60
        },
        {

            "Rank": "4",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "4",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 0.625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1.2,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 4,
            "AirDropScience": 50,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "5",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "5",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 0.75,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 5,
            "AirDropScience": 60,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "6",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "8",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 0.875,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1.4,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 6,
            "AirDropScience": 65,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "7",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "6",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1.5,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 7,
            "AirDropScience": 75,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "8",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "5",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1.125,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 8,
            "AirDropScience": 80,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "9",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "6",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1.25,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 1.8,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 9,
            "AirDropScience": 90,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "10",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "5",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1.375,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 2,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 10,
            "AirDropScience": 95,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "11",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "7",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1.5,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 2.2,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 12.5,
            "AirDropScience": 105,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "12",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "7",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1.625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 2.5,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 15,
            "AirDropScience": 110,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "13",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "3",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1.75,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 2.7,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 17.5,
            "AirDropScience": 115,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "14",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "6",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 1.875,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 20,
            "AirDropScience": 125,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "15",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "6",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 3.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 22.5,
            "AirDropScience": 130,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "16",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "7",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2.125,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 3.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 25,
            "AirDropScience": 140,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "17",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "11",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2.25,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 4,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 27.5,
            "AirDropScience": 145,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "18",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "5",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2.375,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 4.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 30,
            "AirDropScience": 150,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "19",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "8",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2.5,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 4.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 32.5,
            "AirDropScience": 160,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "20",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "8",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2.625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 5,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 35,
            "AirDropScience": 165,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "21",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "8",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2.75,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 5.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 40,
            "AirDropScience": 175,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "22",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "9",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 2.875,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 5.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 45,
            "AirDropScience": 180,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "23",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "6",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 50,
            "AirDropScience": 185,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "24",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "9",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3.125,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 6.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 55,
            "AirDropScience": 195,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "25",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3.25,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 6.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 60,
            "AirDropScience": 200,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "26",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3.375,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 7,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 65,
            "AirDropScience": 220,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "27",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3.5,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 7.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 70,
            "AirDropScience": 235,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "28",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3.625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 7.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 75,
            "AirDropScience": 250,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "29",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3.75,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 8,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 80,
            "AirDropScience": 260,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "30",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 3.875,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 8.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 85,
            "AirDropScience": 275,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "31",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 8.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 90,
            "AirDropScience": 290,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "32",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4.125,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 9,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 95,
            "AirDropScience": 305,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "33",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4.25,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 9.3,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 100,
            "AirDropScience": 320,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "34",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4.375,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 9.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 110,
            "AirDropScience": 330,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "35",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4.5,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 10,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 120,
            "AirDropScience": 345,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "36",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4.625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 10.4,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 130,
            "AirDropScience": 365,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "37",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4.75,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 10.8,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 140,
            "AirDropScience": 380,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "38",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 4.875,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 11.2,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 150,
            "AirDropScience": 400,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "39",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 11.6,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 160,
            "AirDropScience": 415,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "40",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5.125,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 12,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 170,
            "AirDropScience": 435,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "41",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5.25,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 12.5,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 180,
            "AirDropScience": 450,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "42",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5.375,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 13,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 190,
            "AirDropScience": 470,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "43",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5.5,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 13.5,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 200,
            "AirDropScience": 485,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "44",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5.625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 14,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 210,
            "AirDropScience": 520,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "45",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5.75,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 14.5,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 220,
            "AirDropScience": 550,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "46",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 5.875,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 15,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 230,
            "AirDropScience": 585,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "47",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 6,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 16.25,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 244,
            "AirDropScience": 620,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "48",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 6.125,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 17.5,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 258,
            "AirDropScience": 655,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "49",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 6.25,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 18.75,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 272,
            "AirDropScience": 690,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "50",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 6.40625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 20,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 286,
            "AirDropScience": 750,
            "AirDropRankUpCoolDown": 60
        },
        {
            "Rank": "51",
            "Name": "UNUSED",
            "SpriteName": "art-avatar",
            "Missions": "0",
            "ActiveMissionCount": 3,
            "RewardType": "None",
            "NormalGachaMultiplier": 6.5625,
            "PremiumGachaMultiplier": 1,
            "NormalGachaMultiplierScience": 22,
            "PremiumGachaMultiplierScience": 1,
            "GachaMultiplierTrophy": 300,
            "AirDropScience": 815,
            "AirDropRankUpCoolDown": 60
        },
    ],
    "ResearcherRankCosts": [
        {
            "Rarity": "Common",
            "Quantity": [
                9999
            ],
            "Science": [
                999999
            ]
        },
        {
            "Rarity": "Rare",
            "Quantity": [
                9999
            ],
            "Science": [
                999999
            ]
        },
        {
            "Rarity": "Epic",
            "Quantity": [
                9999
            ],
            "Science": [
                999999
            ]
        },
        {
            "Rarity": "Supreme",
            "Quantity": [
                9999
            ],
            "Science": [
                999999
            ]
        },
        {
            "Rarity": "LteCommon",
            "Quantity": [
                5,
                10,
                20,
                50,
                100,
                200,
                400,
                800,
                1000
            ],
            "Science": [
                100,
                200,
                300,
                400,
                800,
                2000,
                4000,
                8000,
                10000

            ]
        },
        {
            "Rarity": "LteRare",
            "Quantity": [
                5,
                10,
                20,
                50,
                100,
                200,
                500

            ],
            "Science": [
                250,
                500,
                1000,
                2500,
                5000,
                10000,
                25000
            ]
        }
    ],
    "Researchers": [
        {
            "Id": "THX001",
            "Name": "I1T1",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["potatomasher"],
            "ExpoMultiplier": 1,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX002",
            "Name": "I1T2",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["chef"],
            "ExpoMultiplier": 2,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX003",
            "Name": "I1T3",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["kitchen"],
            "ExpoMultiplier": 3,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 2,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX004",
            "Name": "I1T4",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["tatertruck"],
            "ExpoMultiplier": 7,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 7,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX005",
            "Name": "I1T5",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["silosmasher"],
            "ExpoMultiplier": 5,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 11,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX006",
            "Name": "I1T6",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["gravyfeds"],
            "ExpoMultiplier": 7,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 19,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX007",
            "Name": "I1T7",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["feastfoundry"],
            "ExpoMultiplier": 7,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX008",
            "Name": "I1T8",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["carbcollective"],
            "ExpoMultiplier": 8,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX009",
            "Name": "I1T9",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["mashmonument"],
            "ExpoMultiplier": 9,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },

        {
            "Id": "THX010",
            "Name": "I2T1",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["backyardturkey"],
            "ExpoMultiplier": 2,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 3,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX011",
            "Name": "I2T2",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["gobbleguru"],
            "ExpoMultiplier": 4,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 5,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX012",
            "Name": "I2T3",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["drumstickfarm"],
            "ExpoMultiplier": 6,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 10,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX013",
            "Name": "I2T4",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["feastfactory"],
            "ExpoMultiplier": 8,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 16,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX014",
            "Name": "I2T5",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["turkeylegtycoon"],
            "ExpoMultiplier": 10,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 20,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX015",
            "Name": "I2T6",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["gravyreactor"],
            "ExpoMultiplier": 12,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX016",
            "Name": "I2T7",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["pilgrimpoultrysyndicate"],
            "ExpoMultiplier": 14,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX017",
            "Name": "I2T8",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["thegreatgobbler"],
            "ExpoMultiplier": 16,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },

        {
            "Id": "THX018",
            "Name": "I3T1",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["toasteroven"],
            "ExpoMultiplier": 3,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 8,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX019",
            "Name": "I3T2",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["familyoven"],
            "ExpoMultiplier": 6,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 11,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX020",
            "Name": "I3T3",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["commercialroaster"],
            "ExpoMultiplier": 9,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 17,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX021",
            "Name": "I3T4",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["conveyorbeltbakeline"],
            "ExpoMultiplier": 12,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX022",
            "Name": "I3T5",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["smartaioven"],
            "ExpoMultiplier": 15,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX023",
            "Name": "I3T6",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["volcanicbakingchamber"],
            "ExpoMultiplier": 18,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX024",
            "Name": "I3T7",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["theeternalovn"],
            "ExpoMultiplier": 21,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },

        {
            "Id": "THX025",
            "Name": "I4T1",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["crustkneader"],
            "ExpoMultiplier": 4,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 19,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX026",
            "Name": "I4T2",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["fillingwhipper"],
            "ExpoMultiplier": 8,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX027",
            "Name": "I4T3",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["pieassemblyline"],
            "ExpoMultiplier": 12,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX028",
            "Name": "I4T4",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["pieempireexecutive"],
            "ExpoMultiplier": 16,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX029",
            "Name": "I4T5",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["sweetfusionlab"],
            "ExpoMultiplier": 20,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX030",
            "Name": "I4T6",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["thegreatbaker"],
            "ExpoMultiplier": 24,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX031",
            "Name": "I5T1",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["dumpsterhorn"],
            "ExpoMultiplier": 5,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX032",
            "Name": "I5T2",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["craftfairsupply"],
            "ExpoMultiplier": 10,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX033",
            "Name": "I5T3",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["harvesthornsmith"],
            "ExpoMultiplier": 15,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX034",
            "Name": "I5T4",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["gildedgourd"],
            "ExpoMultiplier": 20,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX035",
            "Name": "I5T5",
            "ModType": "GenManagerAndSpeedMult",
            "TargetIds": ["theinfinitehorn"],
            "ExpoMultiplier": 25,
            "ExpoGrowth": 3,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteCommon",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX036",
            "Name": "I1Trade",
            "ModType": "TradePayoutMultiplier",
            "TargetIds": [
                "mashpotato"
            ],
            "ExpoMultiplier": 3,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX037",
            "Name": "I2Trade",
            "ModType": "TradePayoutMultiplier",
            "TargetIds": [
                "turkeyleg"
            ],
            "ExpoMultiplier": 4,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 5,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX038",
            "Name": "I3Trade",
            "ModType": "TradePayoutMultiplier",
            "TargetIds": [
                "fire"
            ],
            "ExpoMultiplier": 5,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 11,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX039",
            "Name": "I4Trade",
            "ModType": "TradePayoutMultiplier",
            "TargetIds": [
                "pie"
            ],
            "ExpoMultiplier": 6,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 23,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX040",
            "Name": "I5Trade",
            "ModType": "TradePayoutMultiplier",
            "TargetIds": [
                "cornucopia"
            ],
            "ExpoMultiplier": 7,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 23,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX041",
            "Name": "GlobalTrade",
            "ModType": "TradePayoutMultiplier",
            "TargetIds": [
                "mashpotato, turkeyleg, fire, pie, cornucopia"
            ],
            "ExpoMultiplier": 2.5,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 17,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX042",
            "Name": "I1Production",
            "ModType": "GeneratorPayoutMultiplier",
            "TargetIds": [
                "mashpotato"
            ],
            "ExpoMultiplier": 0.5,
            "ExpoGrowth": 4,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX043",
            "Name": "I2Production",
            "ModType": "GeneratorPayoutMultiplier",
            "TargetIds": [
                "turkeyleg"
            ],
            "ExpoMultiplier": 0.5,
            "ExpoGrowth": 4,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 4,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX044",
            "Name": "I3Production",
            "ModType": "GeneratorPayoutMultiplier",
            "TargetIds": [
                "fire"
            ],
            "ExpoMultiplier": 0.75,
            "ExpoGrowth": 4,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 10,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX045",
            "Name": "I4Production",
            "ModType": "GeneratorPayoutMultiplier",
            "TargetIds": [
                "pie"
            ],
            "ExpoMultiplier": 1,
            "ExpoGrowth": 4,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 21,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX046",
            "Name": "I5Production",
            "ModType": "GeneratorPayoutMultiplier",
            "TargetIds": [
                "cornucopia"
            ],
            "ExpoMultiplier": 1,
            "ExpoGrowth": 4,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX047",
            "Name": "GlobalProduction",
            "ModType": "GeneratorPayoutMultiplier",
            "TargetIds": [
                "mashpotato,turkeyleg,fire,pie,cornucopia"
            ],
            "ExpoMultiplier": 0.75,
            "ExpoGrowth": 4,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 10,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX048",
            "Name": "I1CritBonus",
            "ModType": "GeneratorCritPowerMult",
            "TargetIds": [
                "mashpotato"
            ],
            "ExpoMultiplier": 3,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 15,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX049",
            "Name": "I2CritBonus",
            "ModType": "GeneratorCritPowerMult",
            "TargetIds": [
                "turkeyleg"
            ],
            "ExpoMultiplier": 3,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 18,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX050",
            "Name": "I3CritBonus",
            "ModType": "GeneratorCritPowerMult",
            "TargetIds": [
                "fire"
            ],
            "ExpoMultiplier": 4,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 23,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX051",
            "Name": "I4CritBonus",
            "ModType": "GeneratorCritPowerMult",
            "TargetIds": [
                "pie"
            ],
            "ExpoMultiplier": 5,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 34,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX052",
            "Name": "I5CritBonus",
            "ModType": "GeneratorCritPowerMult",
            "TargetIds": [
                "cornucopia"
            ],
            "ExpoMultiplier": 5,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 1,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX053",
            "Name": "GlobalCritBonus",
            "ModType": "GeneratorCritPowerMult",
            "TargetIds": [
                "mashpotato,turkeyleg,fire,pie,cornucopia"
            ],
            "ExpoMultiplier": 4,
            "ExpoGrowth": 2,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 27,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX054",
            "Name": "GlobalDiscount",
            "ModType": "GeneratorCostReduction",
            "TargetIds": [
                "mashpotato,turkeyleg,fire,pie,cornucopia"
            ],
            "ExpoMultiplier": 1,
            "ExpoGrowth": 10,
            "UpgradePower": 0,
            "CurveModifier": 0,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 40,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
        {
            "Id": "THX055",
            "Name": "GlobalCritChance",
            "ModType": "GeneratorCritChance",
            "TargetIds": [
                "mashpotato,turkeyleg,fire,pie,cornucopia"
            ],
            "ExpoMultiplier": 0,
            "ExpoGrowth": 0,
            "UpgradePower": 0,
            "CurveModifier": 0.125,
            "BasePower": 0,
            "Rarity": "LteRare",
            "PlayerRankUnlock": 6,
            "ResearchOutputType": "Constant",
            "ResearchOutputRate": 1
        },
    ],
    "Resources": [
        {
            "Id": "mashpotato",
            "Singular": "mashedpotato",
            "Plural": "Mashedpotatoes",
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "turkeyleg",
            "Singular": "turkeyleg",
            "Plural": "Turkeylegs",
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "fire",
            "Singular": "fire",
            "Plural": "Fires",
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "pie",
            "Singular": "pie",
            "Plural": "Pies",
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "cornucopia",
            "Singular": "cornucopia",
            "Plural": "Cornucopias",
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "potatomasher",
            "Singular": "Potatomasher",
            "Plural": "potatomashers",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "chef",
            "Singular": "Chef",
            "Plural": "chefs",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "kitchen",
            "Singular": "Kitchen",
            "Plural": "kitchens",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "tatertruck",
            "Singular": "Tatertruck",
            "Plural": "tatertrucks",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "silosmasher",
            "Singular": "Silosmasher",
            "Plural": "silosmashers",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "gravyfeds",
            "Singular": "Gravyfeds",
            "Plural": "gravyfedgens",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "feastfoundry",
            "Singular": "Feastfoundry",
            "Plural": "feastfoundries",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "carbcollective",
            "Singular": "Carbcollective",
            "Plural": "carbcollectives",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "mashmonument",
            "Singular": "Mashmonument",
            "Plural": "mashmonuments",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "backyardturkey",
            "Singular": "Backyardturkey",
            "Plural": "backyardturkeys",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "gobbleguru",
            "Singular": "Gobbleguru",
            "Plural": "gobblegurus",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "drumstickfarm",
            "Singular": "Drumstickfarm",
            "Plural": "drumstickfarms",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "feastfactory",
            "Singular": "Feastfactory",
            "Plural": "feastfactories",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "turkeylegtycoon",
            "Singular": "Turkeylegtycoon",
            "Plural": "turkeylegtycoons",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "gravyreactor",
            "Singular": "Gravyreactor",
            "Plural": "gravyreactors",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "pilgrimpoultrysyndicate",
            "Singular": "Pilgrimpoultrysyndicate",
            "Plural": "pilgrimpoultrysyndicates",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "thegreatgobbler",
            "Singular": "Thegreatgobbler",
            "Plural": "thegreatgobblers",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "toasteroven",
            "Singular": "Toasteroven",
            "Plural": "toasterovens",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "familyoven",
            "Singular": "Familyoven",
            "Plural": "familyovens",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "commercialroaster",
            "Singular": "Commercialroaster",
            "Plural": "commercialroasters",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "conveyorbeltbakeline",
            "Singular": "Conveyorbeltbakeline",
            "Plural": "conveyorbeltbakelines",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "smartaioven",
            "Singular": "Smartaioven",
            "Plural": "smartaiovens",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "volcanicbakingchamber",
            "Singular": "Volcanicbakingchamber",
            "Plural": "volcanicbakingchambers",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "theeternalovn",
            "Singular": "Theeternalovn",
            "Plural": "theeternaloven",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "crustkneader",
            "Singular": "Crustkneader",
            "Plural": "crustkneaders",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "fillingwhipper",
            "Singular": "Fillingwhipper",
            "Plural": "fillingwhippers",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "pieassemblyline",
            "Singular": "Pieassemblyline",
            "Plural": "pieassemblylines",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "pieempireexecutive",
            "Singular": "Pieempireexecutive",
            "Plural": "pieempireexecutives",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "sweetfusionlab",
            "Singular": "Sweetfusionlab",
            "Plural": "sweetfusionlabs",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "thegreatbaker",
            "Singular": "Thegreatbaker",
            "Plural": "thegreatbakers",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "dumpsterhorn",
            "Singular": "Dumpsterhorn",
            "Plural": "dumpsterhorns",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "craftfairsupply",
            "Singular": "Craftfairsupply",
            "Plural": "craftfairsupplies",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "harvesthornsmith",
            "Singular": "Harvesthornsmith",
            "Plural": "harvesthornsmiths",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "gildedgourd",
            "Singular": "Thegildedgourd",
            "Plural": "gildedgourdconsortium",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "theinfinitehorn",
            "Singular": "Theinfinitehorn",
            "Plural": "theinfinithorns",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "darkscience",
            "Singular": "Dark Science",
            "Plural": "Dark Science",
            "CurrencyCode": "SC",
            "Resettable": false,
            "SharedData": false
        },
        {
            "Id": "comrade",
            "Singular": "Comrade",
            "Plural": "Comrades",
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "comradegenerator",
            "Singular": "Comrade",
            "Plural": "Comrades",
            "StartingQty": 1,
            "Resettable": true,
            "SharedData": false
        },
        {
            "Id": "gold",
            "Singular": "Gold",
            "Plural": "Gold",
            "CurrencyCode": "GO",
            "Resettable": false,
            "SharedData": true
        },
        {
            "Id": "trophy",
            "Singular": "Trophy",
            "Plural": "Trophies",
            "Resettable": false,
            "SharedData": false
        },
        {
            "Id": "timehack_1",
            "Singular": "Basic Warp",
            "Plural": "Basic Warps",
            "CurrencyCode": "TH",
            "Resettable": false,
            "SharedData": true
        },
        {
            "Id": "timehack_4",
            "Singular": "Super Warp",
            "Plural": "Super Warps",
            "CurrencyCode": "TH",
            "Resettable": false,
            "SharedData": true
        },
        {
            "Id": "timehack_24",
            "Singular": "Elite Warp",
            "Plural": "Elite Warps",
            "CurrencyCode": "TH",
            "Resettable": false,
            "SharedData": true
        },
        {
            "Id": "timehack_8",
            "Singular": "More Than Basic Time Warp",
            "Plural": "More Than Basic Time Warps",
            "CurrencyCode": "TH",
            "Resettable": false,
            "SharedData": true
        },
        {
            "Id": "timehack_12",
            "Singular": "Semi Mega Time Warp",
            "Plural": "Semi Mega Time Warps",
            "CurrencyCode": "TH",
            "Resettable": false,
            "SharedData": true
        },
        {
            "Id": "specops_point",
            "Singular": "SpecialOps Point",
            "Plural": "SpecialOps Points",
            "StartingQty": 0,
            "Resettable": false,
            "SharedData": false
        },
        "Trades", [
            {
                "Resource": "Mashpotato",
                "CostExponent": 10,
                "CostMultiplier": 500,
                "ComradeMultiplier": 0,
                "ComradeAdd": 1,
                "MaxLevel": 249
            },
            {
                "Resource": "Turkeyleg",
                "CostExponent": 10,
                "CostMultiplier": 500,
                "ComradeMultiplier": 0,
                "ComradeAdd": 2,
                "MaxLevel": 249
            },
            {
                "Resource": "Fire",
                "CostExponent": 10,
                "CostMultiplier": 500,
                "ComradeMultiplier": 0,
                "ComradeAdd": 3,
                "MaxLevel": 249
            },
            {
                "Resource": "Pie",
                "CostExponent": 10,
                "CostMultiplier": 500,
                "ComradeMultiplier": 0,
                "ComradeAdd": 4,
                "MaxLevel": 249
            },
            {
                "Resource": "Cornucopia",
                "CostExponent": 10,
                "CostMultiplier": 500,
                "ComradeMultiplier": 0,
                "ComradeAdd": 5,
                "MaxLevel": 249
            }
        ]
    ],
    "Store": [
        {
            "Name": "Bit O'Gold",
            "InternalId": "t02_gold",
            "ItemClass": "VirtualCurrencyGold",
            "Price": 199,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 160,
                    "RewardId": "GO"
                }
            ],
            "CustomData": "{\"icon\":\"vc-gold1\"}"
        },
        {
            "Name": "Lot O'Gold",
            "InternalId": "t05_gold",
            "ItemClass": "VirtualCurrencyGold",
            "Price": 499,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 500,
                    "RewardId": "GO"
                }
            ],
            "CustomData": "{\"icon\":\"vc-gold2\"}"
        },
        {
            "Name": "Tonne O'Gold",
            "InternalId": "t10_gold",
            "ItemClass": "VirtualCurrencyGold",
            "Price": 999,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 1200,
                    "RewardId": "GO"
                }
            ],
            "CustomData": "{\"icon\":\"vc-gold3\",\"popular\":\"true\"}"
        },
        {
            "Name": "Bucket O'Gold",
            "InternalId": "t20_gold",
            "ItemClass": "VirtualCurrencyGold",
            "Price": 1999,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 2500,
                    "RewardId": "GO"
                }
            ],
            "CustomData": "{\"icon\":\"vc-gold4\"}"
        },
        {
            "Name": "Barrel O'Gold",
            "InternalId": "t50_gold",
            "ItemClass": "VirtualCurrencyGold",
            "Price": 4999,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 6500,
                    "RewardId": "GO"
                }
            ],
            "CustomData": "{\"icon\":\"vc-gold5\"}"
        },
        {
            "Name": "Wheels O'Gold",
            "InternalId": "t60_gold",
            "ItemClass": "VirtualCurrencyGold",
            "Price": 9999,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 14000,
                    "RewardId": "GO"
                }
            ],
            "CustomData": "{\"icon\":\"vc-gold6\",\"bestValue\":\"true\"}"
        },
        {
            "Name": "Discovery Pack",
            "InternalId": "darkscience_1000",
            "ItemClass": "VirtualCurrencyScience",
            "Price": 50,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 1000,
                    "RewardId": "SC"
                }
            ],
            "CustomData": "{\"icon\":\"vc-science1\",\"topUp\":\"true\"}"
        },
        {
            "Name": "Ad Free Airdrops",
            "InternalId": "t06_adfreeairdrop06",
            "ItemClass": "AdFreeAirdrop",
            "Price": 599,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ]
        },
        {
            "Name": "Ad Free Airdrops",
            "InternalId": "t05_adfreeairdrop05",
            "ItemClass": "AdFreeAirdrop",
            "Price": 499,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ]
        },
        {
            "Name": "Ad Free Airdrops",
            "InternalId": "t04_adfreeairdrop04",
            "ItemClass": "AdFreeAirdrop",
            "Price": 399,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ]
        },
        {
            "Name": "Ad Free Airdrops",
            "InternalId": "t03_adfreeairdrop03",
            "ItemClass": "AdFreeAirdrop",
            "Price": 299,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ]
        },
        {
            "Name": "Ad Free Airdrops",
            "InternalId": "t02_adfreeairdrop02",
            "ItemClass": "AdFreeAirdrop",
            "Price": 199,
            "Currency": "RM",
            "Tags": [
                "RealMoneyPurchase"
            ]
        },
        {
            "Name": "Discovery Pack",
            "InternalId": "darkscience_1000",
            "ItemClass": "VirtualCurrencyScience",
            "Price": 50,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 1000,
                    "RewardId": "SC"
                }
            ],
            "CustomData": "{\"icon\":\"vc-science1\",\"topUp\":\"true\"}"
        },
        {
            "Name": "Wise Pack",
            "InternalId": "darkscience_5000",
            "ItemClass": "VirtualCurrencyScience",
            "Price": 200,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 5000,
                    "RewardId": "SC"
                }
            ],
            "CustomData": "{\"icon\":\"vc-science2\"}"
        },
        {
            "Name": "Super Wise Pack",
            "InternalId": "darkscience_15000",
            "ItemClass": "VirtualCurrencyScience",
            "Price": 500,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 15000,
                    "RewardId": "SC"
                }
            ],
            "CustomData": "{\"icon\":\"vc-science4\"}"
        },
        {
            "Name": "Brilliant Pack",
            "InternalId": "darkscience_25000",
            "ItemClass": "VirtualCurrencyScience",
            "Price": 800,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 25000,
                    "RewardId": "SC"
                }
            ],
            "CustomData": "{\"icon\":\"vc-science5\"}"
        },
        {
            "Name": "Super Brilliant Pack",
            "InternalId": "darkscience_35000",
            "ItemClass": "VirtualCurrencyScience",
            "Price": 1100,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 35000,
                    "RewardId": "SC"
                }
            ],
            "CustomData": "{\"icon\":\"vc-science6\"}"
        },
        {
            "Name": "Super Duper Brilliant Pack",
            "InternalId": "darkscience_50000",
            "ItemClass": "VirtualCurrencyScience",
            "Price": 1500,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "VirtualCurrency",
                    "Value": 50000,
                    "RewardId": "SC"
                }
            ],
            "CustomData": "{\"icon\":\"vc-science3\",\"bestValue\":\"true\"}"
        },
        {
            "Name": "Titanium Capsule",
            "InternalId": "gacha_titanium",
            "ItemClass": "Gacha",
            "Price": 750,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "Gacha",
                    "Value": 1,
                    "RewardId": "titanium"
                }
            ],
            "CustomData": "{\"icon\":\"ga-titanium\"}"
        },
        {
            "Name": "Skip 1 Hour!",
            "InternalId": "timehack_1",
            "ItemClass": "Experiment",
            "Price": 50,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "Experiment",
                    "Value": 1,
                    "RewardId": "EX167"
                }
            ],
            "CustomData": "{\"rarity\":\"Rare\"}"
        },
        {
            "Name": "Skip 4 Hours!",
            "InternalId": "timehack_4",
            "ItemClass": "Experiment",
            "Price": 150,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "Experiment",
                    "Value": 1,
                    "RewardId": "EX164"
                }
            ],
            "CustomData": "{\"rarity\":\"Epic\"}"
        },
        {
            "Name": "Skip 8 Hours!",
            "InternalId": "timehack_8",
            "ItemClass": "Experiment",
            "Price": 280,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "Experiment",
                    "Value": 1,
                    "RewardId": "EX168"
                }
            ],
            "CustomData": "{\"rarity\":\"Epic\"}"
        },
        {
            "Name": "Skip 12 Hours!",
            "InternalId": "timehack_12",
            "ItemClass": "Experiment",
            "Price": 400,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "Experiment",
                    "Value": 1,
                    "RewardId": "EX169"
                }
            ],
            "CustomData": "{\"rarity\":\"Epic\"}"
        },
        {
            "Name": "Skip 1 Day!",
            "InternalId": "timehack_24",
            "ItemClass": "Experiment",
            "Price": 750,
            "Currency": "GO",
            "Tags": [
                "GoldPurchase"
            ],
            "Rewards": [
                {
                    "Reward": "Experiment",
                    "Value": 1,
                    "RewardId": "EX165"
                }
            ],
        }
    ],
    "SupremePassConfig": {
        "NumExtraFreeGachaCapsule": 2,
        "PropagandaAdsRemoved": true,
        "SpecOpsTimeReduction": 4,
        "NumExtraSpecOpsSlots": 1,
        "NumPerks": 6,
        "SupremePassStoreItemId": "t10_supremepass",
        "PurchaseTierCost": 250
    },
    "Trades": [
        {
            "Resource": "mashpotato",
            "CostExponent": 10,
            "CostMultiplier": 500,
            "ComradeMultiplier": 0,
            "ComradeAdd": 1,
            "MaxLevel": 249
        },
        {
            "Resource": "turkeyleg",
            "CostExponent": 10,
            "CostMultiplier": 500,
            "ComradeMultiplier": 0,
            "ComradeAdd": 2,
            "MaxLevel": 249
        },
        {
            "Resource": "fire",
            "CostExponent": 10,
            "CostMultiplier": 500,
            "ComradeMultiplier": 0,
            "ComradeAdd": 3,
            "MaxLevel": 249
        },
        {
            "Resource": "pie",
            "CostExponent": 10,
            "CostMultiplier": 500,
            "ComradeMultiplier": 0,
            "ComradeAdd": 4,
            "MaxLevel": 249
        },
        {
            "Resource": "cornucopia",
            "CostExponent": 10,
            "CostMultiplier": 500,
            "ComradeMultiplier": 0,
            "ComradeAdd": 5,
            "MaxLevel": 249
        }
    ]
}

let ADDITIONAL_LANGUAGE = `
lte.thanksgiving.name=Glorious Thanksgiving Feast
lte.thanksgiving.desc=It's that time of year where comrades get together, enjoy a massive feast, huddle up and celebrate the Motherland!





foodlabour=Mash Potato
foodlabour.allindustries=All Mash Potato Industries
resource.mashpotato.singular=Mashed Potato
resource.mashpotato.plural=Mashed Potatoes
resource.potatomasher.singular=Potato Masher
resource.potatomasher.plural=Potato Mashers
resource.chef.singular=Chef
resource.chef.plural=Chefs
resource.kitchen.singular=Kitchen
resource.kitchen.plural=Kitchens
resource.tatertruck.singular=Tater Truck
resource.tatertruck.plural=Tater Trucks
resource.silosmasher.singular=Silo Smasher
resource.silosmasher.plural=Silo Smashers
resource.gravyfeds.singular=Gravy-Fed Generator
resource.gravyfeds.plural=Gravy-Fed Generators
resource.feastfoundry.singular=Feast Foundry
resource.feastfoundry.plural=Feast Foundries
resource.carbcollective.singular=Carb Collective
resource.carbcollective.plural=Carb Collectives
resource.mashmonument.singular=Mash Monument
resource.mashmonument.plural=Mash Monuments

researcher.THX001.name=Researcher I1T1
researcher.THX002.name=Researcher I1T2
researcher.THX003.name=Researcher I1T3
researcher.THX004.name=Researcher I1T4
researcher.THX005.name=Researcher I1T5
researcher.THX006.name=Researcher I1T6
researcher.THX007.name=Researcher I1T7
researcher.THX008.name=Researcher I1T8
researcher.THX009.name=Researcher I1T9
researcher.THX036.name=I1Trade
researcher.THX042.name=I1Production
researcher.THX048.name=I1CritBonus



animallabour=Turkey Leg
animallabour.allindustries=All Turkey Leg Industries
resource.turkeyleg.singular=Turkey Leg
resource.turkeyleg.plural=Turkey Legs
resource.backyardturkey.singular=Backyard Turkey
resource.backyardturkey.plural=Backyard Turkeys
resource.gobbleguru.singular=Gobble Guru
resource.gobbleguru.plural=Gobble Gurus
resource.drumstickfarm.singular=Drumstick Farm
resource.drumstickfarm.plural=Drumstick Farms
resource.feastfactory.singular=Feast Factory
resource.feastfactory.plural=Feast Factories
resource.turkeylegtycoon.singular=Turkey Leg Tycoon
resource.turkeylegtycoon.plural=Turkey Leg Tycoons
resource.gravyreactor.singular=Gravy Reactor
resource.gravyreactor.plural=Gravy Reactors
resource.pilgrimpoultrysyndicate.singular=Pilgrim Poultry Syndicate
resource.pilgrimpoultrysyndicate.plural=Pilgrim Poultry Syndicates
resource.thegreatgobbler.singular=The Great Gobbler
resource.thegreatgobbler.plural=The Great Gobblers

researcher.THX010.name=Researcher I2T1
researcher.THX011.name=Researcher I2T2
researcher.THX012.name=Researcher I2T3
researcher.THX013.name=Researcher I2T4
researcher.THX014.name=Researcher I2T5
researcher.THX015.name=Researcher I2T6
researcher.THX016.name=Researcher I2T7
researcher.THX017.name=Researcher I2T8
researcher.THX037.name=I2Trade
researcher.THX043.name=I2Production
researcher.THX049.name=I2CritBonus



technician=Fire
technician.allindustries=All Fire Industries
resource.fire.singular=Fire
resource.fire.plural=Fires
resource.toasteroven.singular=Toaster Oven
resource.toasteroven.plural=Toaster Ovens
resource.familyoven.singular=Family Oven
resource.familyoven.plural=Family Ovens
resource.commercialroaster.singular=Commercial Roaster
resource.commercialroaster.plural=Commercial Roasters
resource.conveyorbeltbakeline.singular=Conveyor Belt Bake Line
resource.conveyorbeltbakeline.plural=Conveyor Belt Bake Lines
resource.smartaioven.singular=Smart-AI Oven
resource.smartaioven.plural=Smart-AI Ovens
resource.volcanicbakingchamber.singular=Volcanic Baking Chamber
resource.volcanicbakingchamber.plural=Volcanic Baking Chambers
resource.theeternalovn.singular=Eternal Oven
resource.theeternalovn.plural=Eternal Ovens

researcher.THX018.name=Researcher I3T1
researcher.THX019.name=Researcher I3T2
researcher.THX020.name=Researcher I3T3
researcher.THX021.name=Researcher I3T4
researcher.THX022.name=Researcher I3T5
researcher.THX023.name=Researcher I3T6
researcher.THX024.name=Researcher I3T7
researcher.THX038.name=I3Trade
researcher.THX044.name=I3Production
researcher.THX050.name=I3CritBonus



baker=Pie
baker.allindustries=All Pie Industries
resource.pie.singular=Pie
resource.pie.plural=Pies
resource.crustkneader.singular=Crust Kneader
resource.crustkneader.plural=Crust Kneaders
resource.fillingwhipper.singular=Filling Whipper
resource.fillingwhipper.plural=Filling Whippers
resource.pieassemblyline.singular=Pie Assembly Line
resource.pieassemblyline.plural=Pie Assembly Lines
resource.pieempireexecutive.singular=Pie Empire Executive
resource.pieempireexecutive.plural=Pie Empire Executives
resource.sweetfusionlab.singular=Sweet Fusion Lab
resource.sweetfusionlab.plural=Sweet Fusion Labs
resource.thegreatbaker.singular=The Great Baker
resource.thegreatbaker.plural=The Great Bakers

researcher.THX025.name=Researcher I4T1
researcher.THX026.name=Researcher I4T2
researcher.THX027.name=Researcher I4T3
researcher.THX028.name=Researcher I4T4
researcher.THX029.name=Researcher I4T5
researcher.THX030.name=Researcher I4T6
researcher.THX039.name=I4Trade
researcher.THX045.name=I4Production
researcher.THX051.name=I4CritBonus



botanist=Cornucopia
botanist.allindustries=All Cornucopia Industries
resource.cornucopia.singular=Cornucopia
resource.cornucopia.plural=Cornucopias
resource.dumpsterhorn.singular=Dumpster Horn
resource.dumpsterhorn.plural=Dumpster Horns
resource.craftfairsupply.singular=Craft Fair Supply
resource.craftfairsupply.plural=Craft Fair Supplies
resource.harvesthornsmith.singular=Harvest Hornsmith
resource.harvesthornsmith.plural=Harvest Hornsmiths
resource.gildedgourd.singular=Gilded Gourd Consortium
resource.gildedgourd.plural=Gilded Gourd Consortiums
resource.theinfinitehorn.singular=The Infinite Horn
resource.theinfinitehorn.plural=The Infinite Horns

researcher.THX031.name=Researcher I5T1
researcher.THX032.name=Researcher I5T2
researcher.THX033.name=Researcher I5T3
researcher.THX034.name=Researcher I5T4
researcher.THX035.name=Researcher I5T5
researcher.THX040.name=I5Trade
researcher.THX046.name=I5Production
researcher.THX052.name=I5CritBonus



researcher.THX041.name=GlobalTrade
researcher.THX047.name=GlobalProduction
researcher.THX053.name=GlobalCritBonus
researcher.THX054.name=GlobalDiscount
researcher.THX055.name=GlobalCritChance





`.trim();

ENGLISH_LOCALIZATION_STRING += btoa(ADDITIONAL_LANGUAGE);