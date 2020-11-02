const escapeFilename = (filename: string) => {
    return filename.replace(":"," -").replace(/[\/\*\\|\?<>"]/ig, "");
}

export default escapeFilename;