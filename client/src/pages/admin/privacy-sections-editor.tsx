import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Edit, Trash2, Plus, Shield, GripVertical } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { PrivacySection } from '@shared/schema';

export default function PrivacySectionsEditor() {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<PrivacySection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sectionKey: '',
    title: '',
    content: '',
    icon: '',
    sortOrder: 0,
    isActive: true
  });

  const { data: sections, isLoading } = useQuery<PrivacySection[]>({
    queryKey: ['/api/privacy-sections'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ sectionKey, data }: { sectionKey: string; data: any }) => {
      return await apiRequest(`/api/admin/privacy-sections/${sectionKey}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-sections'] });
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث القسم بنجاح',
      });
      setIsDialogOpen(false);
      setEditingSection(null);
    },
    onError: (error: any) => {
      toast({
        title: 'حدث خطأ',
        description: error.message || 'فشل في حفظ التغييرات',
        variant: 'destructive',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/privacy-sections', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-sections'] });
      toast({
        title: 'تم الإنشاء بنجاح',
        description: 'تم إنشاء القسم الجديد بنجاح',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'حدث خطأ',
        description: error.message || 'فشل في إنشاء القسم',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (sectionKey: string) => {
      return await apiRequest(`/api/admin/privacy-sections/${sectionKey}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-sections'] });
      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف القسم بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'حدث خطأ',
        description: error.message || 'فشل في حذف القسم',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      sectionKey: '',
      title: '',
      content: '',
      icon: '',
      sortOrder: 0,
      isActive: true
    });
  };

  const handleEdit = (section: PrivacySection) => {
    setEditingSection(section);
    setFormData({
      sectionKey: section.sectionKey,
      title: section.title,
      content: section.content,
      icon: section.icon || '',
      sortOrder: section.sortOrder ?? 0,
      isActive: section.isActive ?? true
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingSection) {
      updateMutation.mutate({
        sectionKey: editingSection.sectionKey,
        data: {
          title: formData.title,
          content: formData.content,
          icon: formData.icon,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive
        }
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (sectionKey: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      deleteMutation.mutate(sectionKey);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 max-w-6xl" dir="rtl">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">
                    تحرير سياسة الخصوصية
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                    قم بتحرير أقسام سياسة الخصوصية بشكل منفصل
                  </CardDescription>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingSection(null);
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-add-section">
                    <Plus className="w-4 h-4" />
                    إضافة قسم جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSection ? 'تحرير القسم' : 'إضافة قسم جديد'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">مفتاح القسم (sectionKey)</label>
                      <Input
                        value={formData.sectionKey}
                        onChange={(e) => setFormData({ ...formData, sectionKey: e.target.value })}
                        placeholder="introduction"
                        disabled={!!editingSection}
                        data-testid="input-section-key"
                      />
                      <p className="text-xs text-gray-500 mt-1">معرف فريد للقسم (بالإنجليزية فقط، بدون مسافات)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">العنوان</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="مقدمة"
                        data-testid="input-title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">المحتوى</label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="محتوى القسم..."
                        className="min-h-[200px]"
                        data-testid="textarea-content"
                      />
                      <p className="text-xs text-gray-500 mt-1">يمكنك استخدام ✓ • - للتنسيق</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">اسم الأيقونة (اختياري)</label>
                        <Input
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          placeholder="Shield"
                          data-testid="input-icon"
                        />
                        <p className="text-xs text-gray-500 mt-1">من lucide-react</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ترتيب الظهور</label>
                        <Input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                          data-testid="input-sort-order"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="checkbox-active"
                      />
                      <label htmlFor="isActive" className="text-sm">القسم نشط</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        إلغاء
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || createMutation.isPending || !formData.title || !formData.content}
                        data-testid="button-save"
                      >
                        {(updateMutation.isPending || createMutation.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            حفظ
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="mr-3 text-gray-600 dark:text-gray-400">جاري التحميل...</span>
              </div>
            ) : sections && sections.length > 0 ? (
              <div className="space-y-4">
                {sections.map((section) => (
                  <Card key={section.id} className="border-2 hover:border-blue-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center text-gray-400 cursor-move">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white" data-testid={`text-section-title-${section.sectionKey}`}>
                              {section.title}
                            </h3>
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {section.sectionKey}
                            </span>
                            {!section.isActive && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                غير نشط
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap" data-testid={`text-section-content-${section.sectionKey}`}>
                            {section.content.length > 200 
                              ? section.content.substring(0, 200) + '...' 
                              : section.content}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(section)}
                            data-testid={`button-edit-${section.sectionKey}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(section.sectionKey)}
                            className="text-red-600 hover:bg-red-50"
                            data-testid={`button-delete-${section.sectionKey}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>لا توجد أقسام بعد. قم بإضافة القسم الأول!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
