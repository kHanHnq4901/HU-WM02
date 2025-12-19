import { Text, TouchableOpacity, View } from "react-native";

type RadioProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export const Radio = ({ label, checked, disabled, onPress }: RadioProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
  >
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: disabled ? '#ccc' : '#333',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: disabled ? '#ccc' : '#1976D2',
          }}
        />
      )}
    </View>
    <Text style={{ marginLeft: 6, color: disabled ? '#999' : '#000' }}>
      {label}
    </Text>
  </TouchableOpacity>
);
