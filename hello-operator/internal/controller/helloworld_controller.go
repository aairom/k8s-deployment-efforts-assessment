// Package controller implements the reconciliation logic for the HelloWorld custom resource.
package controller

import (
	"context"
	"fmt"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	appsv1alpha1 "github.com/example/hello-operator/api/v1alpha1"
)

const (
	// helloworldFinalizer is the finalizer added to HelloWorld resources.
	helloworldFinalizer = "apps.example.com/finalizer"

	// defaultImage is the container image used when none is specified.
	defaultImage = "hashicorp/http-echo:latest"

	// defaultMessage is the HTTP response text used when none is specified.
	defaultMessage = "Hello, World!"

	// defaultPort is the container port used when none is specified.
	defaultPort int32 = 5678

	// defaultReplicas is the replica count used when none is specified.
	defaultReplicas int32 = 1

	// requeueAfter is the default requeue duration for non-error requeues.
	requeueAfter = 30 * time.Second
)

// HelloWorldReconciler reconciles a HelloWorld object.
// It watches HelloWorld, Deployment, and Service resources and drives the cluster
// toward the desired state defined in each HelloWorld spec.
type HelloWorldReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=apps.example.com,resources=helloworlds,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=apps.example.com,resources=helloworlds/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=apps.example.com,resources=helloworlds/finalizers,verbs=update
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=events,verbs=create;patch

// Reconcile is the main reconciliation function. It is called whenever a HelloWorld,
// its owned Deployment, or its owned Service changes. It brings the cluster state
// into alignment with the desired state declared in the HelloWorld spec.
func (r *HelloWorldReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	// ── 1. Fetch the HelloWorld instance ────────────────────────────────────
	hw := &appsv1alpha1.HelloWorld{}
	if err := r.Get(ctx, req.NamespacedName, hw); err != nil {
		if apierrors.IsNotFound(err) {
			// Resource has been deleted; nothing to do.
			return ctrl.Result{}, nil
		}
		logger.Error(err, "Failed to get HelloWorld")
		return ctrl.Result{}, err
	}

	// ── 2. Apply defaults ───────────────────────────────────────────────────
	r.applyDefaults(hw)

	// ── 3. Handle deletion via finalizer ───────────────────────────────────
	if !hw.DeletionTimestamp.IsZero() {
		return r.handleDeletion(ctx, hw)
	}

	// Add finalizer if absent.
	if !controllerutil.ContainsFinalizer(hw, helloworldFinalizer) {
		if err := r.addFinalizer(ctx, hw); err != nil {
			return ctrl.Result{}, err
		}
	}

	// ── 4. Reconcile Deployment ─────────────────────────────────────────────
	if err := r.reconcileDeployment(ctx, hw); err != nil {
		logger.Error(err, "Failed to reconcile Deployment")
		if statusErr := r.setCondition(ctx, hw,
			string(appsv1alpha1.ConditionDegraded), metav1.ConditionTrue,
			"DeploymentFailed", fmt.Sprintf("Deployment reconciliation failed: %v", err)); statusErr != nil {
			logger.Error(statusErr, "Failed to update status after Deployment error")
		}
		return ctrl.Result{}, err
	}

	// ── 5. Reconcile Service ────────────────────────────────────────────────
	if err := r.reconcileService(ctx, hw); err != nil {
		logger.Error(err, "Failed to reconcile Service")
		if statusErr := r.setCondition(ctx, hw,
			string(appsv1alpha1.ConditionDegraded), metav1.ConditionTrue,
			"ServiceFailed", fmt.Sprintf("Service reconciliation failed: %v", err)); statusErr != nil {
			logger.Error(statusErr, "Failed to update status after Service error")
		}
		return ctrl.Result{}, err
	}

	// ── 6. Update status ────────────────────────────────────────────────────
	if err := r.updateStatus(ctx, hw); err != nil {
		logger.Error(err, "Failed to update HelloWorld status")
		return ctrl.Result{}, err
	}

	return ctrl.Result{RequeueAfter: requeueAfter}, nil
}

// applyDefaults fills in zero-value spec fields with their documented defaults.
func (r *HelloWorldReconciler) applyDefaults(hw *appsv1alpha1.HelloWorld) {
	if hw.Spec.Replicas == nil {
		replicas := defaultReplicas
		hw.Spec.Replicas = &replicas
	}
	if hw.Spec.Message == "" {
		hw.Spec.Message = defaultMessage
	}
	if hw.Spec.Image == "" {
		hw.Spec.Image = defaultImage
	}
	if hw.Spec.Port == 0 {
		hw.Spec.Port = defaultPort
	}
	if hw.Spec.ServiceType == "" {
		hw.Spec.ServiceType = appsv1alpha1.ServiceTypeClusterIP
	}
}

// handleDeletion performs cleanup when a HelloWorld resource is being deleted.
// It removes the finalizer to allow Kubernetes to complete garbage collection.
func (r *HelloWorldReconciler) handleDeletion(ctx context.Context, hw *appsv1alpha1.HelloWorld) (ctrl.Result, error) {
	logger := log.FromContext(ctx)
	if controllerutil.ContainsFinalizer(hw, helloworldFinalizer) {
		logger.Info("Performing finalizer cleanup for HelloWorld", "name", hw.Name)
		// Owned resources (Deployment, Service) are cleaned up automatically
		// via owner references. Remove the finalizer to complete deletion.
		controllerutil.RemoveFinalizer(hw, helloworldFinalizer)
		if err := r.Update(ctx, hw); err != nil {
			logger.Error(err, "Failed to remove finalizer")
			return ctrl.Result{}, err
		}
	}
	return ctrl.Result{}, nil
}

// addFinalizer adds the operator's finalizer to the HelloWorld resource.
func (r *HelloWorldReconciler) addFinalizer(ctx context.Context, hw *appsv1alpha1.HelloWorld) error {
	controllerutil.AddFinalizer(hw, helloworldFinalizer)
	return r.Update(ctx, hw)
}

// deploymentName returns the name used for the Deployment owned by hw.
func deploymentName(hw *appsv1alpha1.HelloWorld) string {
	return hw.Name + "-deployment"
}

// serviceName returns the name used for the Service owned by hw.
func serviceName(hw *appsv1alpha1.HelloWorld) string {
	return hw.Name + "-service"
}

// labelsForHelloWorld returns the label set applied to all resources owned by hw.
func labelsForHelloWorld(name string) map[string]string {
	return map[string]string{
		"app.kubernetes.io/name":       "helloworld",
		"app.kubernetes.io/instance":   name,
		"app.kubernetes.io/managed-by": "hello-operator",
	}
}

// reconcileDeployment ensures a Deployment matching the HelloWorld spec exists and is up to date.
func (r *HelloWorldReconciler) reconcileDeployment(ctx context.Context, hw *appsv1alpha1.HelloWorld) error {
	logger := log.FromContext(ctx)
	labels := labelsForHelloWorld(hw.Name)

	desired := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deploymentName(hw),
			Namespace: hw.Namespace,
			Labels:    labels,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: hw.Spec.Replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: labels,
				},
				Spec: corev1.PodSpec{
					SecurityContext: &corev1.PodSecurityContext{
						RunAsNonRoot: boolPtr(true),
					},
					Containers: []corev1.Container{
						{
							Name:  "helloworld",
							Image: hw.Spec.Image,
							Args:  []string{fmt.Sprintf("-text=%s", hw.Spec.Message)},
							Ports: []corev1.ContainerPort{
								{
									Name:          "http",
									ContainerPort: hw.Spec.Port,
									Protocol:      corev1.ProtocolTCP,
								},
							},
							SecurityContext: &corev1.SecurityContext{
								AllowPrivilegeEscalation: boolPtr(false),
								ReadOnlyRootFilesystem:   boolPtr(true),
								RunAsNonRoot:             boolPtr(true),
								Capabilities: &corev1.Capabilities{
									Drop: []corev1.Capability{"ALL"},
								},
							},
							ReadinessProbe: &corev1.Probe{
								ProbeHandler: corev1.ProbeHandler{
									HTTPGet: &corev1.HTTPGetAction{
										Path: "/",
										Port: intstr.FromInt32(hw.Spec.Port),
									},
								},
								InitialDelaySeconds: 5,
								PeriodSeconds:       10,
							},
							LivenessProbe: &corev1.Probe{
								ProbeHandler: corev1.ProbeHandler{
									HTTPGet: &corev1.HTTPGetAction{
										Path: "/",
										Port: intstr.FromInt32(hw.Spec.Port),
									},
								},
								InitialDelaySeconds: 15,
								PeriodSeconds:       20,
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    mustParseQuantity("50m"),
									corev1.ResourceMemory: mustParseQuantity("64Mi"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceCPU:    mustParseQuantity("200m"),
									corev1.ResourceMemory: mustParseQuantity("128Mi"),
								},
							},
						},
					},
				},
			},
		},
	}

	// Set owner reference so the Deployment is garbage-collected with the HelloWorld.
	if err := controllerutil.SetControllerReference(hw, desired, r.Scheme); err != nil {
		return fmt.Errorf("setting owner reference on Deployment: %w", err)
	}

	existing := &appsv1.Deployment{}
	err := r.Get(ctx, types.NamespacedName{Name: desired.Name, Namespace: desired.Namespace}, existing)
	if apierrors.IsNotFound(err) {
		logger.Info("Creating Deployment", "name", desired.Name)
		return r.Create(ctx, desired)
	}
	if err != nil {
		return fmt.Errorf("getting Deployment: %w", err)
	}

	// Update only the mutable fields.
	existing.Spec.Replicas = desired.Spec.Replicas
	existing.Spec.Template.Spec.Containers[0].Image = desired.Spec.Template.Spec.Containers[0].Image
	existing.Spec.Template.Spec.Containers[0].Args = desired.Spec.Template.Spec.Containers[0].Args
	existing.Labels = desired.Labels

	logger.Info("Updating Deployment", "name", existing.Name)
	return r.Update(ctx, existing)
}

// reconcileService ensures a Service matching the HelloWorld spec exists and is up to date.
func (r *HelloWorldReconciler) reconcileService(ctx context.Context, hw *appsv1alpha1.HelloWorld) error {
	logger := log.FromContext(ctx)
	labels := labelsForHelloWorld(hw.Name)

	desired := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      serviceName(hw),
			Namespace: hw.Namespace,
			Labels:    labels,
		},
		Spec: corev1.ServiceSpec{
			Selector: labels,
			Type:     corev1.ServiceType(hw.Spec.ServiceType),
			Ports: []corev1.ServicePort{
				{
					Name:       "http",
					Port:       80,
					TargetPort: intstr.FromInt32(hw.Spec.Port),
					Protocol:   corev1.ProtocolTCP,
				},
			},
		},
	}

	// Set owner reference so the Service is garbage-collected with the HelloWorld.
	if err := controllerutil.SetControllerReference(hw, desired, r.Scheme); err != nil {
		return fmt.Errorf("setting owner reference on Service: %w", err)
	}

	existing := &corev1.Service{}
	err := r.Get(ctx, types.NamespacedName{Name: desired.Name, Namespace: desired.Namespace}, existing)
	if apierrors.IsNotFound(err) {
		logger.Info("Creating Service", "name", desired.Name)
		return r.Create(ctx, desired)
	}
	if err != nil {
		return fmt.Errorf("getting Service: %w", err)
	}

	// Update the service type and ports; preserve ClusterIP.
	existing.Spec.Type = desired.Spec.Type
	existing.Spec.Ports = desired.Spec.Ports
	existing.Spec.Selector = desired.Spec.Selector
	existing.Labels = desired.Labels

	logger.Info("Updating Service", "name", existing.Name)
	return r.Update(ctx, existing)
}

// updateStatus reads the current Deployment status and writes it back to the HelloWorld status.
func (r *HelloWorldReconciler) updateStatus(ctx context.Context, hw *appsv1alpha1.HelloWorld) error {
	dep := &appsv1.Deployment{}
	if err := r.Get(ctx, types.NamespacedName{
		Name:      deploymentName(hw),
		Namespace: hw.Namespace,
	}, dep); err != nil {
		return fmt.Errorf("getting Deployment for status update: %w", err)
	}

	hw.Status.ReadyReplicas = dep.Status.ReadyReplicas
	hw.Status.AvailableReplicas = dep.Status.AvailableReplicas
	hw.Status.ObservedGeneration = hw.Generation

	available := dep.Status.AvailableReplicas >= *hw.Spec.Replicas

	if available {
		meta.SetStatusCondition(&hw.Status.Conditions, metav1.Condition{
			Type:               string(appsv1alpha1.ConditionAvailable),
			Status:             metav1.ConditionTrue,
			Reason:             "DeploymentAvailable",
			Message:            fmt.Sprintf("%d/%d replicas available", dep.Status.AvailableReplicas, *hw.Spec.Replicas),
			ObservedGeneration: hw.Generation,
		})
		meta.SetStatusCondition(&hw.Status.Conditions, metav1.Condition{
			Type:               string(appsv1alpha1.ConditionProgressing),
			Status:             metav1.ConditionFalse,
			Reason:             "DeploymentAvailable",
			Message:            "Deployment is fully available",
			ObservedGeneration: hw.Generation,
		})
		meta.SetStatusCondition(&hw.Status.Conditions, metav1.Condition{
			Type:               string(appsv1alpha1.ConditionDegraded),
			Status:             metav1.ConditionFalse,
			Reason:             "DeploymentAvailable",
			Message:            "Deployment is healthy",
			ObservedGeneration: hw.Generation,
		})
	} else {
		meta.SetStatusCondition(&hw.Status.Conditions, metav1.Condition{
			Type:               string(appsv1alpha1.ConditionAvailable),
			Status:             metav1.ConditionFalse,
			Reason:             "DeploymentUnavailable",
			Message:            fmt.Sprintf("%d/%d replicas available", dep.Status.AvailableReplicas, *hw.Spec.Replicas),
			ObservedGeneration: hw.Generation,
		})
		meta.SetStatusCondition(&hw.Status.Conditions, metav1.Condition{
			Type:               string(appsv1alpha1.ConditionProgressing),
			Status:             metav1.ConditionTrue,
			Reason:             "DeploymentProgressing",
			Message:            "Deployment is rolling out",
			ObservedGeneration: hw.Generation,
		})
	}

	return r.Status().Update(ctx, hw)
}

// setCondition is a helper that sets a single status condition and patches the status subresource.
func (r *HelloWorldReconciler) setCondition(ctx context.Context, hw *appsv1alpha1.HelloWorld,
	condType string, status metav1.ConditionStatus, reason, message string) error {
	meta.SetStatusCondition(&hw.Status.Conditions, metav1.Condition{
		Type:               condType,
		Status:             status,
		Reason:             reason,
		Message:            message,
		ObservedGeneration: hw.Generation,
	})
	return r.Status().Update(ctx, hw)
}

// SetupWithManager registers the HelloWorldReconciler with the controller-runtime Manager.
// It also sets up watches on owned Deployments and Services so that changes to those
// resources trigger a reconciliation of the owning HelloWorld.
func (r *HelloWorldReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&appsv1alpha1.HelloWorld{}).
		Owns(&appsv1.Deployment{}).
		Owns(&corev1.Service{}).
		Complete(r)
}

// boolPtr returns a pointer to the given bool value.
func boolPtr(b bool) *bool { return &b }

// mustParseQuantity parses a resource.Quantity string and panics on error.
// It is safe to use with compile-time constant strings.
func mustParseQuantity(s string) resource.Quantity {
	return resource.MustParse(s)
}
