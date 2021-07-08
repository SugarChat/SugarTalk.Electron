import React from 'react';

interface IMeetingContextValue {
  video: boolean;
  setVideo: React.Dispatch<React.SetStateAction<boolean>>;
  voice: boolean;
  setVoice: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MeetingContext = React.createContext<IMeetingContextValue>({
  video: true,
  setVideo: () => {},
  voice: true,
  setVoice: () => {},
});

export const MeetingProvider: React.FC = ({ children }) => {
  const [video, setVideo] = React.useState<boolean>(true);
  const [voice, setVoice] = React.useState<boolean>(true);

  return (
    <MeetingContext.Provider
      value={{
        video,
        setVideo,
        voice,
        setVoice,
      }}
    >
      {children && children}
    </MeetingContext.Provider>
  );
};
