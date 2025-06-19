import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedText } from '../ThemedText';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
  style?: ViewStyle;
  fullScreen?: boolean;
  debugInfo?: string;
}

export function ErrorMessage({
  title = 'Oops! Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  showIcon = true,
  style,
  fullScreen = false,
  debugInfo,
}: ErrorMessageProps) {
  const { colors } = useTheme();
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={[containerStyle, { backgroundColor: colors.background }, style]}>
      {showIcon && (
        <Ionicons 
          name="alert-circle-outline" 
          size={48} 
          color="#FF6B6B" 
          style={styles.icon}
        />
      )}
      
      <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </ThemedText>
      
      <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </ThemedText>
      
      {debugInfo && (
        <ThemedText style={{ color: '#FF6B6B', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {debugInfo}
        </ThemedText>
      )}
      
      {onRetry && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.retryIcon} />
          <ThemedText style={styles.retryText}>
            {retryText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Specific error components for common scenarios
interface NetworkErrorProps {
  onRetry?: () => void;
  style?: ViewStyle;
}

export function NetworkError({ onRetry, style }: NetworkErrorProps) {
  return (
    <ErrorMessage
      title="No Internet Connection"
      message="Please check your internet connection and try again."
      onRetry={onRetry}
      retryText="Retry"
      style={style}
    />
  );
}

interface NoResultsProps {
  searchQuery?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export function NoResults({ searchQuery, onClear, style }: NoResultsProps) {
  const { colors } = useTheme();
  const message = searchQuery 
    ? `No movies found for "${searchQuery}". Try searching with different keywords.`
    : "No movies found. Try adjusting your search criteria.";

  return (
    <View style={[styles.noResultsContainer, { backgroundColor: colors.background }, style]}>
      <Ionicons 
        name="search-outline" 
        size={48} 
        color="#999999" 
        style={styles.icon}
      />
      
      <ThemedText style={[styles.noResultsTitle, { color: colors.textPrimary }]}>
        No Results Found
      </ThemedText>
      
      <ThemedText style={[styles.noResultsMessage, { color: colors.textSecondary }]}>
        {message}
      </ThemedText>
      
      {onClear && searchQuery && (
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={onClear}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.clearButtonText}>
            Clear Search
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  message,
  icon = "folder-open-outline",
  actionText,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }, style]}>
      <Ionicons 
        name={icon} 
        size={64} 
        color="#CCCCCC" 
        style={styles.emptyIcon}
      />
      
      <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {title}
      </ThemedText>
      
      <ThemedText style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {message}
      </ThemedText>
      
      {onAction && actionText && (
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onAction}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.actionButtonText}>
            {actionText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: '#666666',
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  noResultsTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333333',
  },
  noResultsMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: '#666666',
    paddingHorizontal: 20,
  },
  clearButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 350,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333333',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    color: '#666666',
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorMessage; 