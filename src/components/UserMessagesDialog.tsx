import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserMessages, useUnreadMessageCount, useMarkMessageRead } from "@/hooks/useAdminMessages";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function UserMessagesDialog() {
  const { data: messages, isLoading } = useUserMessages();
  const { data: unreadCount } = useUnreadMessageCount();
  const markRead = useMarkMessageRead();
  const [open, setOpen] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-profit" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "success":
        return "bg-profit/10 border-profit/20";
      default:
        return "bg-primary/10 border-primary/20";
    }
  };

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {(unreadCount || 0) > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Messages from Admin
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          ) : messages?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No messages yet
            </p>
          ) : (
            messages?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  getTypeBg(msg.type),
                  !msg.is_read && "ring-2 ring-primary/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(msg.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{msg.title}</h4>
                        {!msg.is_read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!msg.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleMarkRead(msg.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
