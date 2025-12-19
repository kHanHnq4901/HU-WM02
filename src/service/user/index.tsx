import { Linking, Platform } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { showAlert } from '../../util';

const TAG = 'SERVICE USER:';

export async function checkUpdateFromStore()
{
    console.log('checkUpdateFromStore .....');
    
    try{

    const platform = Platform.OS + ': ';

    const latestVersion = await VersionCheck.getLatestVersion();
    const currentVersion = VersionCheck.getCurrentVersion();
  
    let rest = await VersionCheck.needUpdate({
        depth: 2,
        currentVersion: currentVersion,
        latestVersion: latestVersion,
      });

      console.log('currentVersion:', currentVersion);
      console.log('latestVersion:', latestVersion);
      

    if(rest.isNeeded)
    {
        //2.1.0 && 2.2.0
        let url = '';
        if(Platform.OS === 'android')
        {
            url = await VersionCheck.getStoreUrl();
        }else{
            url = 'https://apps.apple.com/us/app/hu-01-esoft/id6458392785';
        }

        showAlert("Ứng dụng đã có phiên bản mới " + latestVersion, {
            label: 'Cập nhật',
            func: () => {
                Linking.openURL(url);  // open store if update is needed.
            }
        });

    }else{
        //2.1.0 && 2.1.1
        rest = await VersionCheck.needUpdate({
            depth: 3,
            currentVersion: currentVersion,
            latestVersion: latestVersion,
          });
        if(rest.isNeeded)
        {
            console.log( platform +  'Đã có phiên bản cập nhật nhỏ của ứng dụng');

        }else{
            
        }
    }

}catch(err : any){
    console.log(TAG, err);
    
}
}