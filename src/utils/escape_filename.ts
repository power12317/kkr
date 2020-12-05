const escapeFilename = (filename: string) => {
    return filename.replace(/:/g," -").replace(/[\/\*\\\|\?<>"]/ig, "_");
}

export default escapeFilename;