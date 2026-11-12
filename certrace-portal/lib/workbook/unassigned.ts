/* The workbook key of a workspace with no installation. Uploads for it are
   stored on the server under this id, per company and year, like any
   installation's. Lower case and underscore, so no installation reference
   (normaliseReference: upper case A-Z0-9- only) can ever produce it. */
export const UNASSIGNED_WORKBOOK_ID = "_unassigned";
