const DEVS = ["@mat:matdoes.dev", "@eva:blahaj.nyc", "@xyzeva:matrix.org"]

type Badge = 'dev';

export function getBadges(userId: string): Badge[] {
    let badges: Badge[] = []
    if(DEVS.includes(userId)) badges.push("dev")

    return badges
}