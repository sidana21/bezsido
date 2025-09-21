import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, MapPin, Clock, Heart, Plus, AlertCircle, CheckCircle, MessageCircle } from "lucide-react";

const helpRequestSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  category: z.string().min(1, "يجب اختيار فئة"),
  urgency: z.enum(["low", "medium", "high"])
});

const categories = [
  { id: "grocery", name: "تسوق" },
  { id: "transport", name: "مواصلات" },
  { id: "repair", name: "إصلاحات" },
  { id: "childcare", name: "رعاية أطفال" },
  { id: "elderly", name: "مساعدة كبار السن" },
  { id: "emergency", name: "طوارئ" }
];

const urgencyLevels = [
  { value: "low", label: "عادي", color: "bg-green-500" },
  { value: "medium", label: "متوسط", color: "bg-yellow-500" },
  { value: "high", label: "عاجل", color: "bg-red-500" }
];

export default function Neighborhoods() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const form = useForm({
    resolver: zodResolver(helpRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      urgency: "medium" as const
    }
  });

  // Get user's neighborhood groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<any[]>({
    queryKey: ["/api/neighborhood-groups"],
    enabled: true
  });

  // Get help requests in user's area
  const { data: helpRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/help-requests", selectedCategory],
    enabled: true
  });

  // Create help request mutation
  const createHelpRequest = useMutation({
    mutationFn: (data: z.infer<typeof helpRequestSchema>) => 
      apiRequest("/api/help-requests", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      }),
    onSuccess: () => {
      toast({
        title: "تم إنشاء طلب المساعدة بنجاح! 🤝",
        description: "سيتم إشعار الجيران في المنطقة"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/help-requests"] });
      setIsCreateDialogOpen(false);
      form.reset();
    }
  });

  // Join group mutation
  const joinGroup = useMutation({
    mutationFn: (groupId: string) => 
      apiRequest(`/api/neighborhood-groups/${groupId}/join`, {
        method: "POST"
      }),
    onSuccess: () => {
      toast({
        title: "انضممت للمجموعة بنجاح! 🎉",
        description: "يمكنك الآن التفاعل مع جيرانك"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhood-groups"] });
    }
  });

  // Help someone mutation
  const offerHelp = useMutation({
    mutationFn: (requestId: string) => 
      apiRequest(`/api/help-requests/${requestId}/help`, {
        method: "POST"
      }),
    onSuccess: () => {
      toast({
        title: "شكراً لتقديم المساعدة! ⭐",
        description: "ستحصل على نقاط ثقة من المجتمع"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/help-requests"] });
    }
  });

  const onSubmit = (data: z.infer<typeof helpRequestSchema>) => {
    createHelpRequest.mutate(data);
  };

  if (groupsLoading || requestsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#075e54] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جارِ تحميل مجتمعك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-[#075e54] text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            مجتمع الحي
          </h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" data-testid="button-create-help-request">
                <Plus className="h-4 w-4 mr-2" />
                طلب مساعدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>طلب مساعدة من الجيران</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان الطلب</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: أحتاج مساعدة في شراء دواء"
                            data-testid="input-help-title"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفئة</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full p-2 border rounded-md"
                            data-testid="select-help-category"
                            {...field}
                          >
                            <option value="">اختر فئة</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مستوى الأولوية</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full p-2 border rounded-md"
                            data-testid="select-help-urgency"
                            {...field}
                          >
                            {urgencyLevels.map(level => (
                              <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تفاصيل الطلب</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="وصف تفصيلي للمساعدة المطلوبة..."
                            data-testid="textarea-help-description"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={createHelpRequest.isPending}
                    data-testid="button-submit-help-request"
                    className="w-full"
                  >
                    {createHelpRequest.isPending ? "جارِ الإرسال..." : "إرسال طلب المساعدة"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold" data-testid="text-neighbors-count">{groups.length * 15}</div>
            <div className="text-sm opacity-80">جار</div>
          </div>
          <div>
            <div className="text-2xl font-bold" data-testid="text-requests-count">{helpRequests.length}</div>
            <div className="text-sm opacity-80">طلب مساعدة</div>
          </div>
          <div>
            <div className="text-2xl font-bold" data-testid="text-groups-count">{groups.length}</div>
            <div className="text-sm opacity-80">مجموعة</div>
          </div>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="p-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="all" data-testid="tab-all-requests">طلبات المساعدة</TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">مجموعات الحي</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filter Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              data-testid="filter-all"
            >
              الكل
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`filter-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Help Requests */}
          <div className="space-y-4">
            {helpRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">لا توجد طلبات مساعدة حالياً</p>
                  <p className="text-sm text-gray-500 mt-2">كن أول من يساعد جيرانه!</p>
                </CardContent>
              </Card>
            ) : (
              helpRequests.map((request: any) => {
                const urgency = urgencyLevels.find(u => u.value === request.urgency);
                const category = categories.find(c => c.id === request.category);
                
                return (
                  <Card key={request.id} className="border-l-4 border-l-[#075e54]" data-testid={`card-help-request-${request.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2" data-testid={`text-help-title-${request.id}`}>
                            {request.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" data-testid={`badge-category-${request.id}`}>
                              {category?.name}
                            </Badge>
                            <Badge 
                              className={`${urgency?.color} text-white`}
                              data-testid={`badge-urgency-${request.id}`}
                            >
                              {urgency?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              منذ {Math.floor(Math.random() * 24)} ساعة
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              على بعد {Math.floor(Math.random() * 500) + 100}م
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4" data-testid={`text-help-description-${request.id}`}>
                        {request.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {request.helpersCount || 0} شخص عرض المساعدة
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            data-testid={`button-message-${request.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            رسالة
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => offerHelp.mutate(request.id)}
                            disabled={offerHelp.isPending}
                            data-testid={`button-offer-help-${request.id}`}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            أساعد
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {/* Neighborhood Groups */}
          <div className="space-y-4">
            {groups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">لا توجد مجموعات في منطقتك بعد</p>
                  <p className="text-sm text-gray-500 mt-2">انضم إلى مجموعة أو أنشئ واحدة جديدة</p>
                </CardContent>
              </Card>
            ) : (
              groups.map((group: any) => (
                <Card key={group.id} data-testid={`card-group-${group.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2" data-testid={`text-group-name-${group.id}`}>
                          <Users className="h-5 w-5" />
                          {group.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {group.memberCount || Math.floor(Math.random() * 50) + 10} عضو
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => joinGroup.mutate(group.id)}
                        disabled={joinGroup.isPending}
                        data-testid={`button-join-group-${group.id}`}
                      >
                        انضم
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300" data-testid={`text-group-description-${group.id}`}>
                      {group.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-group-location-${group.id}`}>
                        {group.location}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}