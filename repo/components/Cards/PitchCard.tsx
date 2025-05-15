import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { Card, Text, Badge, useTheme, Button, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

// LinkedIn-inspired theme colors (same as other files)
const THEME = {
  primary: '#0A66C2', // LinkedIn blue
  secondary: '#1E2A3A', // Dark navy
  background: '#F3F2EF', // Light gray
  cardBackground: '#FFFFFF', // White
  cardContent: '#F5F1E8', // Light beige
  textDark: '#191919', // Almost black
  textLight: '#FFFFFF', // White
  textMedium: '#666666', // Medium gray
  error: '#E34D4D', // Red
  success: '#4CAF50', // Green
  border: '#E0E0E0', // Light gray border
};

// Import formatter utilities
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Simplified formatter: round down to nearest K or M
const formatCompactAmount = (amount: number) => {
  if (amount >= 1000000) {
    return `$${Math.floor(amount / 1000000)}M`;
  } else if (amount >= 1000) {
    return `$${Math.floor(amount / 1000)}K`;
  }
  return `$${amount}`;
};

// Define the startup interface based on the database schema
interface StartupCardProps {
  startup: {
    id: string;
    name: string;
    logo: string;
    askamount: number;
    valuation: number;
    roi: number;
    problem: string;
    solution: string;
    stage: string;
    industry: string;
    risklevel: string;
    tagline?: string;
    description?: string;
  };
  onPress: () => void;
}

const getRiskLevelColor = (riskLevel: string): readonly [string, string] => {
  switch (riskLevel.toLowerCase()) {
    case 'high':
      return [THEME.error, '#FF7676'] as const;
    case 'medium':
      return ['#FFA726', '#FFCC80'] as const;
    case 'low':
      return [THEME.success, '#A5D6A7'] as const;
    default:
      return ['#90CAF9', '#BBDEFB'] as const;
  }
};

const getStageColor = (stage: string) => {
  switch (stage.toLowerCase()) {
    case 'seed':
      return '#8BC34A';
    case 'series a':
      return THEME.primary;
    case 'series b':
      return '#FF7043';
    case 'series c':
      return '#9575CD';
    default:
      return '#78909C';
  }
};

const { width } = Dimensions.get('window');

export const PitchCard: React.FC<StartupCardProps> = ({ startup, onPress }) => {
  const theme = useTheme();
  const riskColors = getRiskLevelColor(startup.risklevel);
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Card style={styles.card}>
        {/* Card Header with Title */}
        <View style={styles.headerSection}>
          {startup.logo ? (
            <Image source={{ uri: startup.logo }} style={styles.logoImage} />
          ) : (
            <Avatar.Text size={60} label={startup.name.slice(0,2).toUpperCase()} style={styles.avatar} labelStyle={styles.avatarLabel} />
          )}
          <Text variant="headlineLarge" style={styles.companyName}>{startup.name}</Text>
          {startup.tagline && <Text variant="titleMedium" style={styles.tagline}>{startup.tagline}</Text>}
          <View style={styles.tagsRow}>
            <View style={[styles.pill, styles.askPill]}>
              <Text style={[styles.pillText, styles.askPillText]}>Ask: {formatCompactAmount(startup.askamount)}</Text>
            </View>
          </View>
          {/* Industry, Stage, Risk Row with Icons */}
          <View style={styles.iconRow}>
            <View style={styles.iconPill}>
              <FontAwesome name="leaf" size={16} color="#1DBA6E" style={{marginRight: 4}} />
              <Text style={styles.iconPillText}>{startup.industry}</Text>
            </View>
            <View style={styles.iconPill}>
              <FontAwesome name="flag" size={16} color="#FFD700" style={{marginRight: 4}} />
              <Text style={styles.iconPillText}>{startup.stage}</Text>
            </View>
            <View style={styles.iconPill}>
              <FontAwesome name="sliders" size={16} color="#FFA726" style={{marginRight: 4}} />
              <Text style={styles.iconPillText}>{startup.risklevel}</Text>
            </View>
          </View>
        </View>
        <Card.Content style={styles.contentContainer}>
          {/* Financial Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <FontAwesome name="usd" size={24} color={THEME.success} style={styles.metricIcon} />
              <Text style={styles.metricValue}>{formatCompactAmount(startup.askamount)}</Text>
              <Text style={styles.metricLabel}>Ask</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.metricItem}>
              <FontAwesome name="balance-scale" size={24} color={THEME.primary} style={styles.metricIcon} />
              <Text style={styles.metricValue}>{formatCompactAmount(startup.valuation)}</Text>
              <Text style={styles.metricLabel}>Valuation</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.metricItem}>
              <FontAwesome name="percent" size={24} color={THEME.error} style={styles.metricIcon} />
              <Text style={styles.metricValue}>+{startup.roi.toFixed(0)}%</Text>
              <Text style={styles.metricLabel}>ROI</Text>
            </View>
          </View>
          <View style={styles.divider} />
          {/* Descriptive Sections */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <FontAwesome name="file-text-o" size={20} color={THEME.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{startup.description}</Text>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome name="exclamation-circle" size={20} color={THEME.error} style={styles.detailIcon} />
              <Text style={styles.detailText}>{startup.problem}</Text>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome name="lightbulb-o" size={20} color={THEME.success} style={styles.detailIcon} />
              <Text style={styles.detailText}>{startup.solution}</Text>
            </View>
            <TouchableOpacity style={styles.makeOfferHeader} onPress={onPress}>
              <Text style={styles.makeOfferHeaderText}>Full Pitch</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  headerSection: {
    backgroundColor: '#0B2239', // deep blue
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  companyName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 32,
    marginBottom: 4,
  },
  cardFooter: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: THEME.cardBackground,
  },
  makeOfferButton: {
    flex: 1,
    backgroundColor: '#000000',
  },
  makeOfferLabel: {
    color: THEME.textLight,
    fontWeight: 'bold',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  avatar: {
    marginBottom: 8,
  },
  avatarLabel: {
    color: THEME.textLight,
    fontWeight: 'bold',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  pillText: {
    textShadowColor: '#32CD32',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    fontWeight: 'bold',
    fontSize: 12,
  },
  askPill: {
    backgroundColor: '#1DBA6E', // green
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  askPillText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  valuationPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  pillHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 6,
  },
  iconPillText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pillLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  pillLabelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 18,
    color: '#B0C4D4',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  makeOfferHeader: {
    backgroundColor: '#1746A2', // blue
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginTop: 8,
    alignSelf: 'center',
  },
  makeOfferHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricSeparator: {
    width: 1,
    backgroundColor: THEME.border,
    marginHorizontal: 8,
    alignSelf: 'stretch',
  },
  metricIcon: {
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textDark,
  },
  metricLabel: {
    fontSize: 14,
    color: THEME.textMedium,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 12,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    flex: 1,
    color: THEME.textDark,
    textAlign: 'justify',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
});

export default PitchCard; 