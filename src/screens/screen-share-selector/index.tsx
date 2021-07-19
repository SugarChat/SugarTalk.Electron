import {
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@material-ui/core';
import electron, { desktopCapturer } from 'electron';
import { DesktopCapturerSource } from 'electron/main';
import React, { useEffect, useState } from 'react';
import { PageScreen } from '../../components/page-screen';
import * as styles from './styles';

type MyDesktopCapturerSource = DesktopCapturerSource & { selected: boolean };

interface ScreenData {
  screenSources: MyDesktopCapturerSource[];
}

const defaultScreenData: ScreenData = { screenSources: [] };

export const ScreenShareSelector = () => {
  const [screenData, setScreenData] = useState(defaultScreenData);

  useEffect(() => {
    if (!screenData.screenSources.length) {
      const getScreenSources = async () => {
        const screenSources = await desktopCapturer.getSources({
          types: ['window', 'screen'],
        });

        setScreenData({
          screenSources: screenSources.map((x) => {
            const screen: MyDesktopCapturerSource = {
              ...x,
              selected: false,
            };
            return screen;
          }),
        });
      };

      getScreenSources();
    }
  }, [screenData]);

  const onItemSelected = (source: MyDesktopCapturerSource) => {
    source.selected = !source.selected;

    const newScreenData = { ...screenData };
    newScreenData.screenSources.forEach((x) => {
      if (x.id !== source.id) {
        x.selected = false;
      } else {
        x.selected = true;
      }
    });
    setScreenData(newScreenData);
    console.log(newScreenData);
  };

  const onConfirmClicked = () => {
    const selectedScreen = screenData.screenSources.find(
      (x) => x.selected === true
    );
    if (selectedScreen) {
      const currentWindow = electron.remote.getCurrentWindow();
      const parent = currentWindow.getParentWindow();

      parent.webContents.send('share-screen-selected', selectedScreen.id);
      currentWindow.close();
    }
  };

  return (
    <PageScreen>
      <ImageList rowHeight={120} cols={5} style={styles.imageList}>
        {screenData.screenSources.map((item, index) => (
          <div
            style={item.selected ? styles.selectedBox : styles.unselectedBox}
            key={index}
            onClick={() => onItemSelected(item)}
          >
            <ImageListItem cols={1} style={{ height: 100 }}>
              <img src={item.thumbnail.toDataURL()} alt={item.display_id} />
              <ImageListItemBar
                position="bottom"
                subtitle={item.name}
                style={styles.itembar}
              />
            </ImageListItem>
          </div>
        ))}
      </ImageList>
      <div style={styles.bottomToolbar}>
        <Button
          color="primary"
          variant="contained"
          onClick={onConfirmClicked}
          disableElevation
        >
          确定
        </Button>
      </div>
    </PageScreen>
  );
};
