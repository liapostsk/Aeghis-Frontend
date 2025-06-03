import React from 'react';
import { View, Text, Button, StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../../lib/storage/useUserStorage';

export default function ProfileImageStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}){

  const { user, setUser } = useUserStore();

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    setUser({ ...user, image: result.assets?.[0]?.uri || '' });

    if (!result.canceled) {
      console.log(result);
    } else {
      alert('You did not select any image.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Add your profile photo</Text>
        <Text style={styles.text}>This helps your mutuals to find you{"\n"}easily in the map</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/addPicture.png")}
          style={styles.image}
        />

        <Pressable
          onPress={pickImageAsync}
          style={styles.addPictureButton}
        >
          <Text style={styles.addPictureText}>Add your photo</Text>
        </Pressable>

      </View>
    
      <View style={styles.buttonContainer}>
        <Button title="Back" onPress={onBack} />
        <Button title="Skip" onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  text: {
    fontSize: 19,
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.1,
    backgroundColor: '#FFFFFF',
    marginBottom: 25,
  },
  addPictureButton: {
    backgroundColor: 'yellow',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 250,
    height: 47,
  },
  addPictureText: {
    color: '#7A33CC',
    fontSize: 20,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});
