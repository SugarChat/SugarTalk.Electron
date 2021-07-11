import {
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@material-ui/core';
import { desktopCapturer } from 'electron';
import { DesktopCapturerSource } from 'electron/main';
import React, { useEffect, useState } from 'react';
import { PageScreen } from '../../../../components/page-screen';
import * as styles from './styles';

interface ScreenData {
  screenSources: DesktopCapturerSource[];
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
        console.log(screenSources);

        setScreenData({
          screenSources,
        });
      };

      getScreenSources();
    }
  }, [screenData]);

  return (
    <PageScreen>
      <div>
        <ImageList rowHeight={200} cols={3} style={styles.imageList}>
          {screenData.screenSources.map((item, index) => (
            <ImageListItem key={index} cols={1}>
              <img src={item.thumbnail.toDataURL()} alt={item.display_id} />
              <ImageListItemBar title={item.name} />
            </ImageListItem>
          ))}
        </ImageList>
        <div style={styles.bottomToolbar}>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {}}
            disableElevation
          >
            确定
          </Button>
        </div>
      </div>
    </PageScreen>
  );
};
