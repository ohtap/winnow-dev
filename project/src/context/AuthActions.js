
export const changeWDirectory = (winnowDir) => ({
    type: "DIRECTORY CHANGE",
    payload: winnowDir
});

export const changeRecentDir = (recentDir) => ({
    type: "RECENT RUN CHANGE",
    payload: recentDir
});
