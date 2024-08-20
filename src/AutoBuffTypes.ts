type effectConversions = {
    [name: string]: string
}

export const effectConversions: effectConversions = {
    strength: "strength",
    speed: "swiftness",
    regeneration: "regeneration",
    resistance: "turtle_master",
    invisibility: "invisibility",
    "instant health": "healing",
    instant_health: "healing",
    instanthealth: "healing",

}

export enum Results {
    SUCCESS = 0,
    PARTIAL = 1,
    FAIL = 2,
    BUSY = 3,
    CANCELLED = 4,
    ALREADY_BUFFED = 5,

}