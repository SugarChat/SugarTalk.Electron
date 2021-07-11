import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import * as styles from './styles';

export interface ILoadingProps {
  maxCloseTime?: number;
}

export interface ILoadingActions {
  open: () => void;
  close: () => void;
}

export const Loading: React.FC<ILoadingProps> = forwardRef(
  ({ maxCloseTime = 10000 }, ref) => {
    const [loading, setLoading] = useState<boolean>(false);
    const timeRef = useRef<NodeJS.Timeout>();

    useImperativeHandle(ref, () => ({
      open,
      close,
    }));

    const open = () => {
      setLoading(true);
    };

    const close = () => {
      setLoading(false);
    };

    const expireTimeToClose = () => {
      timeRef.current = setTimeout(() => {
        setLoading(false);
      }, maxCloseTime);
    };

    useEffect(() => {
      window.loadingOpen = open;
      window.loadingClose = close;
      return () => {
        if (timeRef.current) clearTimeout(timeRef.current);
      };
    }, []);

    return <div style={styles.root}>{loading && <CircularProgress />}</div>;
  }
);
