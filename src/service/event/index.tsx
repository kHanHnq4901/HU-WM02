import { Alert, BackHandler, DeviceEventEmitter, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { PATH_IMPORT_CSDL, PATH_IMPORT_XML } from '../../shared/path';
import { getFilExtension, showAlert } from '../../util';

import { PACKAGE_NAME, RECEIVE_FILE_CSDL, RECEIVE_FILE_XML } from './constant';
import { deleteFile } from '../../shared/file';

const TAG = 'EVENT1: ';

type FileSharedProps = {
  contentUri: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  subject: string;
  text: string;
  weblink: string;
  extension: string;
};

export const onReceiveSharingIntent = () => {
  console.log('Package name ' + Platform.OS + ' :' + PACKAGE_NAME);
  // ReceiveSharingIntent.clearReceivedFiles();
  ReceiveSharingIntent.getReceivedFiles(
    files => {
      // console.log('receive file .... here:' + JSON.stringify(files));
      let hasXmlFile = false;
      let hasCSDLFile = false;
      let fs = files as FileSharedProps[];
      new Promise<void>((resolve, reject) => {
        console.log('fs.length:', fs.length);

        let numFileXml = 0;

        fs.forEach(async (file, index) => {
          // console.log('file:', file);
          console.log(TAG, 'received file ...: ' + JSON.stringify(file));

          const extension = (
            file.extension ?? getFilExtension(file.fileName)
          ).toLocaleLowerCase();
          console.log('extention file:', extension);
          // console.log(
          //   'isExist file.filePath:',
          //   await RNFS.exists(file.filePath),
          // );

          if (extension === 'xml') {
            try {

              numFileXml ++;

              const destPath = PATH_IMPORT_XML + '/' + file.fileName.toLowerCase();

              console.log('des path:', destPath);

              // console.log('delete file:');
              // await RNFS.unlink(file.filePath);
              // return;

              
              if(Platform.OS === 'ios')
              {
                if(await RNFS.exists(destPath) === true)
                {
                  console.log(TAG,'delete file old');
                  await deleteFile(destPath);
                  
                }
              }

              await RNFS.moveFile(file.filePath, destPath);
              hasXmlFile = true;
              console.log(TAG, 'move file xml success 1');
              if(fs.length === 1)
              {
                Alert.alert(
                  'Nhận được file',
                  'Nhận file ' +
                    file.fileName +
                    '\nBạn có muốn nhập dữ liệu ngay?',
                  [
                    {
                      text: 'Để sau',
                      style: 'destructive',
                    },
                    {
                      text: 'Nhập ngay',
                      onPress: async () => {
                        await importXmlFromPath([destPath]);
                        Alert.alert(
                          'Thoát ứng dụng',
                          'Cần thoát ứng dụng để nạp lại dữ liệu.Bạn có muốn thoát không ?',
                          [
                            {
                              text: 'Để sau',
                              style: 'cancel',
                            },
                            {
                              text: 'Thoát',
                              onPress: () => {
                                // BackHandler.exitApp();
                                BackHandler.exitApp();
                              },
                            },
                          ],
                        );
                      },
                    },
                  ],
                );
              }
              
            } catch (err :any) {
              console.log(TAG, 'Err1: ' + err.message);
            }
          } else if (extension === 'db') {
            try {
              console.log('move file');

              await RNFS.moveFile(
                file.filePath,
                PATH_IMPORT_CSDL + '/' + file.fileName,
              );
              hasCSDLFile = true;
              console.log(TAG, 'move file db success');
            } catch (err :any) {
              console.log(TAG, 'Err: ' + err.message);
            }
          }

          if (index === fs.length - 1) {
            //console.log('resolve');
            if(fs.length > 1)
            {
              showAlert('Đã nhận ' + numFileXml + 'file. Bạn cần vào mục Nhập dữ liệu để chọn file cần nhập');
            }
            
            resolve();
          }
        });
      }).then(() => {
        //console.log('check');
        if (hasXmlFile) {
          DeviceEventEmitter.emit(RECEIVE_FILE_XML);
          //console.log(TAG, 'receive xml file');
        }
        if (hasCSDLFile) {
          //console.log(TAG, 'receive csdl file');
          DeviceEventEmitter.emit(RECEIVE_FILE_CSDL);
        }
      });
    },
    error => {
      //console.log(TAG, 'afff:', error);
    },
    // 'ShareMedia',
    PACKAGE_NAME, // share url protocol (must be unique to your app, suggest using your apple bundle id)
    // 'com.gelex.emic.hu-01-esoft',
  );
};
