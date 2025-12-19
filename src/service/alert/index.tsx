import { data, store } from '../../component/alert';

export const closeAlert = () => {
  store.setValue(value => {
    value.alert.show = false;
    return { ...value };
  });
};

type Props = {
  title: string;
  subtitle: string;
  onOkPress?: () => void;
  onCancelPress?: () => void;
};

export const showAlertInfo = (props: Props) => {
  data.onOKPress = props.onOkPress ?? null;
  data.onCancelPress = props.onCancelPress ?? null;
  data.icon = 'information-variant';
  data.title = props.title;
  data.subtitle = props.subtitle;
  data.theme = 'info';
  store.setValue(value => {
    value.alert.show = true;
    return { ...value };
  });
};

export const showAlertSuccess = (props: Props) => {
  data.onOKPress = props.onOkPress ?? null;
  data.onCancelPress = props.onCancelPress ?? null;
  data.icon = 'check-bold';
  data.title = props.title;
  data.subtitle = props.subtitle;
  data.theme = 'success';
  store.setValue(value => {
    value.alert.show = true;
    return { ...value };
  });
};

export const showAlertWarning = (props: Props) => {
  data.onOKPress = props.onOkPress ?? null;
  data.onCancelPress = props.onCancelPress ?? null;
  data.icon = 'alert-circle';
  data.title = props.title;
  data.subtitle = props.subtitle;
  data.theme = 'warning';
  store.setValue(value => {
    value.alert.show = true;
    return { ...value };
  });
};

export const showAlertDanger = (props: Props) => {
  data.onOKPress = props.onOkPress ?? null;
  data.onCancelPress = props.onCancelPress ?? null;
  data.icon = 'alpha-x-box';
  data.title = props.title;
  data.subtitle = props.subtitle;
  data.theme = 'danger';
  store.setValue(value => {
    value.alert.show = true;
    return { ...value };
  });
};
