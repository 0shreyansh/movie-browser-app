import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 
  | 'light'
  | 'medium' 
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

class HapticService {
  private isEnabled: boolean = true;

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if haptics are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Light haptic feedback - for subtle interactions
   * Use for: button taps, menu selections, toggle switches
   */
  async light(): Promise<void> {
    if (!this.isEnabled || Platform.OS !== 'ios') return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Medium haptic feedback - for standard interactions
   * Use for: card selections, filter changes, refresh actions
   */
  async medium(): Promise<void> {
    if (!this.isEnabled || Platform.OS !== 'ios') return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Heavy haptic feedback - for important interactions
   * Use for: successful actions, important confirmations
   */
  async heavy(): Promise<void> {
    if (!this.isEnabled || Platform.OS !== 'ios') return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Success haptic feedback - for positive actions
   * Use for: adding to favorites, successful searches, downloads
   */
  async success(): Promise<void> {
    if (!this.isEnabled || Platform.OS !== 'ios') return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Warning haptic feedback - for cautionary actions
   * Use for: removing from favorites, clearing data
   */
  async warning(): Promise<void> {
    if (!this.isEnabled || Platform.OS !== 'ios') return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Error haptic feedback - for negative actions
   * Use for: network errors, validation errors, failed actions
   */
  async error(): Promise<void> {
    if (!this.isEnabled || Platform.OS !== 'ios') return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Selection haptic feedback - for picker/selector changes
   * Use for: genre selection, sort option changes, tab switches
   */
  async selection(): Promise<void> {
    if (!this.isEnabled || Platform.OS !== 'ios') return;
    
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger haptic feedback by type
   */
  async trigger(type: HapticType): Promise<void> {
    switch (type) {
      case 'light':
        return this.light();
      case 'medium':
        return this.medium();
      case 'heavy':
        return this.heavy();
      case 'success':
        return this.success();
      case 'warning':
        return this.warning();
      case 'error':
        return this.error();
      case 'selection':
        return this.selection();
      default:
        return this.light();
    }
  }

  /**
   * Custom haptic patterns for specific interactions
   */
  async favoriteToggle(isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await this.success();
    } else {
      await this.light();
    }
  }

  async themeToggle(): Promise<void> {
    await this.selection();
  }

  async movieSelect(): Promise<void> {
    await this.medium();
  }

  async filterChange(): Promise<void> {
    await this.selection();
  }

  async refreshStart(): Promise<void> {
    await this.light();
  }

  async refreshComplete(): Promise<void> {
    await this.success();
  }

  async searchInput(): Promise<void> {
    await this.light();
  }

  async navigationChange(): Promise<void> {
    await this.selection();
  }

  async buttonPress(): Promise<void> {
    await this.light();
  }

  async longPress(): Promise<void> {
    await this.medium();
  }

  async pullToRefresh(): Promise<void> {
    await this.light();
  }

  async loadMoreItems(): Promise<void> {
    await this.light();
  }

  async errorOccurred(): Promise<void> {
    await this.error();
  }

  async actionCompleted(): Promise<void> {
    await this.success();
  }
}

// Create and export singleton instance
export const hapticService = new HapticService();

// Export convenience functions
export const haptic = {
  light: () => hapticService.light(),
  medium: () => hapticService.medium(),
  heavy: () => hapticService.heavy(),
  success: () => hapticService.success(),
  warning: () => hapticService.warning(),
  error: () => hapticService.error(),
  selection: () => hapticService.selection(),
  
  // Convenience methods for common interactions
  favoriteToggle: (isFavorite: boolean) => hapticService.favoriteToggle(isFavorite),
  themeToggle: () => hapticService.themeToggle(),
  movieSelect: () => hapticService.movieSelect(),
  filterChange: () => hapticService.filterChange(),
  refreshStart: () => hapticService.refreshStart(),
  refreshComplete: () => hapticService.refreshComplete(),
  searchInput: () => hapticService.searchInput(),
  navigationChange: () => hapticService.navigationChange(),
  buttonPress: () => hapticService.buttonPress(),
  longPress: () => hapticService.longPress(),
  pullToRefresh: () => hapticService.pullToRefresh(),
  loadMoreItems: () => hapticService.loadMoreItems(),
  errorOccurred: () => hapticService.errorOccurred(),
  actionCompleted: () => hapticService.actionCompleted(),
};

export default hapticService; 