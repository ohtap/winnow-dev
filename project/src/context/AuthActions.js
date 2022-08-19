
export const changeWDirectory = (winnowDir) => ({
    type: "DIRECTORY CHANGE",
    payload: winnowDir
});

export const changeRecentDir = (recentDir) => ({
    type: "RECENT RUN CHANGE",
    payload: recentDir
});

export const runResults = (toRun) => ({
    type: "RUN RESULTS",
    payload: toRun
})
