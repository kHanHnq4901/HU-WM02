import RNFS from 'react-native-fs';

export const PATH_IMPORT_XML = RNFS.DocumentDirectoryPath + '/xml';
export const PATH_EXPORT_XML = RNFS.DocumentDirectoryPath + '/xml';
export const PATH_EXPORT_LOG = RNFS.DocumentDirectoryPath + '/log';

export const PATH_IMPORT_CSDL = RNFS.DocumentDirectoryPath + '/csdl';

export const PATH_EXECUTE_CSDL = RNFS.DocumentDirectoryPath.replace(
  'files',
  'databases',
);
export const PATH_EXPORT_EXCEL = RNFS.DocumentDirectoryPath + '/excel';
export const PATH_EXPORT_CSDL = PATH_IMPORT_CSDL;
 // RNFS.ExternalStorageDirectoryPath + '/GLX_HHU_EM/csdl';
export const PATH_EXPORT_XML_EXTERNAL =
  RNFS.ExternalStorageDirectoryPath + '/GLX_HHU_EM/xml';

export const NAME_CSDL = 'local_csdl.db';
