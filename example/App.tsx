import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PressMe } from './src/PressMe';

const Section: React.FC<{
  title: string;
}> = ({ children, title }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{children}</Text>
    </View>
  );
};

const App = () => {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      testID="ScrollView"
    >
      <StatusBar barStyle="dark-content" />

      <Image source={require('./assets/logo.png')} style={styles.logo} />

      <PressMe />

      <Section title="Setup">
        Install <Text style={styles.highlight}>react-native-owl</Text> and
        follow the instructions in the documentation to complete the setup. Note
        that you will have to do some platform specific setup for iOS & Android.
      </Section>

      <Section title="Baseline Screenshots">
        Generate, validate and commit the baseline images. These will be used
        for the comparison, every time you run the tests suite.
      </Section>

      <Section title="Generated Report">
        If your tests are failing, you can view the generated report which will
        display any differences between the baselines and fresh screenshots.
      </Section>

      <Section title="Scroll Content">
        This text is in place only for demo purposes.
      </Section>

      <Section title="Scroll-to-end Content">
        This text is in place only for demo purposes.
      </Section>
    </ScrollView>
  );
};

const colors = {
  SLATE_200: '#e2e8f0',
  SLATE_500: '#64748b',
  GRAY_800: '#1f2937',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.SLATE_200,
  },
  contentContainer: {
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  logo: {
    width: 175,
    height: 175,
    alignSelf: 'center',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: colors.GRAY_800,
  },
  textLongPressed: {
    marginTop: 35,
    fontSize: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  textInputLabel: {
    fontWeight: '600',
    marginBottom: 5,
    paddingHorizontal: 20,
  },
  textInput: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
