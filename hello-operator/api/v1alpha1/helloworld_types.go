// Package v1alpha1 contains API Schema definitions for the apps.example.com v1alpha1 API group.
package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ServiceType specifies how the HelloWorld service is exposed.
// +kubebuilder:validation:Enum=ClusterIP;NodePort;LoadBalancer
type ServiceType string

const (
	// ServiceTypeClusterIP exposes the service on a cluster-internal IP only.
	ServiceTypeClusterIP ServiceType = "ClusterIP"
	// ServiceTypeNodePort exposes the service on each Node's IP at a static port.
	ServiceTypeNodePort ServiceType = "NodePort"
	// ServiceTypeLoadBalancer exposes the service externally using a cloud provider's load balancer.
	ServiceTypeLoadBalancer ServiceType = "LoadBalancer"
)

// HelloWorldSpec defines the desired state of HelloWorld.
type HelloWorldSpec struct {
	// Replicas is the number of desired pod replicas.
	// Defaults to 1 if not specified.
	// +kubebuilder:validation:Minimum=0
	// +kubebuilder:validation:Maximum=10
	// +kubebuilder:default=1
	// +optional
	Replicas *int32 `json:"replicas,omitempty"`

	// Message is the text returned by the Hello World HTTP server.
	// Defaults to "Hello, World!" if not specified.
	// +kubebuilder:default="Hello, World!"
	// +optional
	Message string `json:"message,omitempty"`

	// Image is the container image to run.
	// Defaults to hashicorp/http-echo:latest.
	// +kubebuilder:default="hashicorp/http-echo:latest"
	// +optional
	Image string `json:"image,omitempty"`

	// Port is the port the container listens on.
	// Defaults to 5678.
	// +kubebuilder:validation:Minimum=1
	// +kubebuilder:validation:Maximum=65535
	// +kubebuilder:default=5678
	// +optional
	Port int32 `json:"port,omitempty"`

	// ServiceType determines how the Kubernetes Service is exposed.
	// Valid values are ClusterIP (default), NodePort, or LoadBalancer.
	// +kubebuilder:default=ClusterIP
	// +optional
	ServiceType ServiceType `json:"serviceType,omitempty"`
}

// ConditionType represents the type of a HelloWorld status condition.
type ConditionType string

const (
	// ConditionAvailable indicates that the HelloWorld deployment is available and serving traffic.
	ConditionAvailable ConditionType = "Available"
	// ConditionProgressing indicates that the HelloWorld deployment is being reconciled or rolled out.
	ConditionProgressing ConditionType = "Progressing"
	// ConditionDegraded indicates that the HelloWorld deployment is in a degraded state.
	ConditionDegraded ConditionType = "Degraded"
)

// HelloWorldStatus defines the observed state of HelloWorld.
type HelloWorldStatus struct {
	// Conditions represent the latest available observations of the HelloWorld's current state.
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`

	// ReadyReplicas is the number of pods targeted by this HelloWorld that have a Ready condition.
	// +optional
	ReadyReplicas int32 `json:"readyReplicas,omitempty"`

	// AvailableReplicas is the total number of available pods targeted by this HelloWorld.
	// +optional
	AvailableReplicas int32 `json:"availableReplicas,omitempty"`

	// ObservedGeneration is the most recent generation observed by the controller.
	// +optional
	ObservedGeneration int64 `json:"observedGeneration,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Replicas",type="integer",JSONPath=".spec.replicas",description="Desired replicas"
// +kubebuilder:printcolumn:name="Ready",type="integer",JSONPath=".status.readyReplicas",description="Ready replicas"
// +kubebuilder:printcolumn:name="Message",type="string",JSONPath=".spec.message",description="Hello message"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"
// +kubebuilder:resource:scope=Namespaced,shortName=hw,categories=all

// HelloWorld is the Schema for the helloworlds API.
// It represents a simple "Hello World" HTTP server managed by the hello-operator.
type HelloWorld struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// Spec defines the desired state of the HelloWorld application.
	Spec HelloWorldSpec `json:"spec,omitempty"`
	// Status defines the observed state of the HelloWorld application.
	Status HelloWorldStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// HelloWorldList contains a list of HelloWorld resources.
type HelloWorldList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []HelloWorld `json:"items"`
}

func init() {
	SchemeBuilder.Register(&HelloWorld{}, &HelloWorldList{})
}
