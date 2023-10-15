import initMatrix from "../client/initMatrix";
import cons from "../client/state/cons";


// FIXME: hack, wait for https://github.com/matrix-org/matrix-spec-proposals/pull/1769 to be implemented to properly store data
export async function getAboutMe(userId: string, currentRoom: string): Promise<string | null> {
    const { matrixClient } = initMatrix

    const stateEvent = await matrixClient.getStateEvent(currentRoom, "m.room.member", userId)

    let aboutMe: string | null = stateEvent[cons.VARIANCE_ABOUT_ME]

    if(!aboutMe) {
        updateAboutMe(currentRoom) // just to be sure, so we're right next call
        return null
    }

    if(aboutMe.length > 1000) aboutMe = aboutMe.substring(0, 998)
    return aboutMe
}


export async function setAboutMe(content: string): Promise<string | null> {
    if(content.length > 1000) return "About me has to be less then 1000 characters."
    const { matrixClient, roomList } = initMatrix

    matrixClient.setAccountData(cons.VARIANCE_ABOUT_ME, {
        "value": content
    })

    roomList._populateRooms()
    
    return null
}

export async function updateAboutMe(roomId: string) {
    const { matrixClient } = initMatrix

    const userId = matrixClient.getUserId()
    const aboutMe = matrixClient.getAccountData(cons.VARIANCE_ABOUT_ME)?.getContent()

    if(!aboutMe) return

    let data = (await matrixClient.getStateEvent(roomId, "m.room.member", userId)) ?? {}

    data[cons.VARIANCE_ABOUT_ME] = aboutMe["value"]

    await matrixClient.sendStateEvent(roomId, "m.room.member", data, userId)
}