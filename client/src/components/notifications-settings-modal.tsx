import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Volume2, VolumeX, Smartphone, Globe, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NotificationsSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSettingsModal({ open, onOpenChange }: NotificationsSettingsModalProps) {
  const [enableSound, setEnableSound] = useState(true);
  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState(true);
  const [enablePushNotifications, setEnablePushNotifications] = useState(true);
  const [soundVolume, setSoundVolume] = useState(60);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyGroupMessages, setNotifyGroupMessages] = useState(true);
  const [notifySocialUpdates, setNotifySocialUpdates] = useState(true);
  const [notifyOrders, setNotifyOrders] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    if (open) {
      const settings = localStorage.getItem('bizchat_notification_settings');
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          setEnableSound(parsed.enableSound ?? true);
          setEnableBrowserNotifications(parsed.enableBrowserNotifications ?? true);
          setEnablePushNotifications(parsed.enablePushNotifications ?? true);
          setSoundVolume(parsed.soundVolume ?? 60);
          setNotifyMessages(parsed.notifyMessages ?? true);
          setNotifyGroupMessages(parsed.notifyGroupMessages ?? true);
          setNotifySocialUpdates(parsed.notifySocialUpdates ?? true);
          setNotifyOrders(parsed.notifyOrders ?? true);
        } catch (error) {
          console.log('خطأ في تحميل إعدادات الإشعارات:', error);
        }
      }
    }
  }, [open]);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      enableSound,
      enableBrowserNotifications,
      enablePushNotifications,
      soundVolume,
      notifyMessages,
      notifyGroupMessages,
      notifySocialUpdates,
      notifyOrders,
      lastUpdated: Date.now()
    };
    localStorage.setItem('bizchat_notification_settings', JSON.stringify(settings));
    
    // Apply settings immediately
    console.log('✅ تم حفظ إعدادات الإشعارات:', settings);
    onOpenChange(false);
  };

  const resetToDefaults = () => {
    setEnableSound(true);
    setEnableBrowserNotifications(true);
    setEnablePushNotifications(true);
    setSoundVolume(60);
    setNotifyMessages(true);
    setNotifyGroupMessages(true);
    setNotifySocialUpdates(true);
    setNotifyOrders(true);
  };

  const testNotificationSound = () => {
    if (enableSound) {
      // Play test notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = soundVolume / 100;
      audio.play().catch(e => console.log('لا يمكن تشغيل صوت الاختبار:', e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="notifications-settings-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Settings className="h-5 w-5 text-emerald-600" />
            إعدادات الإشعارات
          </DialogTitle>
          <DialogDescription className="text-right text-gray-600 dark:text-gray-400">
            تخصيص كيفية تلقي الإشعارات في بيز شات
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Sound Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {enableSound ? (
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" />
                )}
                <Label htmlFor="enable-sound" className="text-sm font-medium">
                  تشغيل الأصوات
                </Label>
              </div>
              <Switch
                id="enable-sound"
                checked={enableSound}
                onCheckedChange={setEnableSound}
                data-testid="switch-enable-sound"
              />
            </div>
            
            {enableSound && (
              <div className="space-y-3 pr-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    مستوى الصوت: {soundVolume}%
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotificationSound}
                    className="text-xs"
                    data-testid="button-test-sound"
                  >
                    اختبار
                  </Button>
                </div>
                <Slider
                  value={[soundVolume]}
                  onValueChange={(value) => setSoundVolume(value[0])}
                  max={100}
                  min={0}
                  step={10}
                  className="w-full"
                  data-testid="slider-sound-volume"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <Label htmlFor="enable-browser" className="text-sm font-medium">
                  إشعارات المتصفح
                </Label>
              </div>
              <Switch
                id="enable-browser"
                checked={enableBrowserNotifications}
                onCheckedChange={setEnableBrowserNotifications}
                data-testid="switch-enable-browser"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-purple-600" />
                <Label htmlFor="enable-push" className="text-sm font-medium">
                  الإشعارات الفورية
                </Label>
              </div>
              <Switch
                id="enable-push"
                checked={enablePushNotifications}
                onCheckedChange={setEnablePushNotifications}
                data-testid="switch-enable-push"
              />
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              أنواع الإشعارات
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-messages" className="text-sm">
                  رسائل جديدة
                </Label>
                <Switch
                  id="notify-messages"
                  checked={notifyMessages}
                  onCheckedChange={setNotifyMessages}
                  data-testid="switch-notify-messages"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-group" className="text-sm">
                  رسائل المجموعات
                </Label>
                <Switch
                  id="notify-group"
                  checked={notifyGroupMessages}
                  onCheckedChange={setNotifyGroupMessages}
                  data-testid="switch-notify-group"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-social" className="text-sm">
                  المنشورات والحالات
                </Label>
                <Switch
                  id="notify-social"
                  checked={notifySocialUpdates}
                  onCheckedChange={setNotifySocialUpdates}
                  data-testid="switch-notify-social"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-orders" className="text-sm">
                  الطلبات والمتاجر
                </Label>
                <Switch
                  id="notify-orders"
                  checked={notifyOrders}
                  onCheckedChange={setNotifyOrders}
                  data-testid="switch-notify-orders"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex-1"
            data-testid="button-reset-defaults"
          >
            إعادة تعيين
          </Button>
          <Button
            onClick={saveSettings}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-save-settings"
          >
            حفظ الإعدادات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}