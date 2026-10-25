import { forwardRef, useState, type ComponentProps } from 'react';
import { TextInput } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Field, IconButton } from '@/ui';

type Props = Omit<ComponentProps<typeof Field>, 'secureTextEntry' | 'rightAccessory'>;

export default forwardRef<TextInput, Props>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return <Field {...props} ref={ref} secureTextEntry={!visible} maxLength={props.maxLength ?? 128}
    autoCapitalize="none" autoCorrect={false}
    rightAccessory={<IconButton icon={visible ? EyeOff : Eye}
      label={`${visible ? 'Ocultar' : 'Mostrar'} ${props.label.toLowerCase()}`}
      disabled={props.editable === false} onPress={() => setVisible(value => !value)} />} />;
});
